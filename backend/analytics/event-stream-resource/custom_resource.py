from __future__ import print_function
from crhelper import CfnResource
import os
import logging
import boto3
from botocore.exceptions import ClientError, WaiterError, ParamValidationError, MissingParametersError
import json
import time

logger = logging.getLogger(__name__)
helper = CfnResource(json_logging=False, log_level='DEBUG', boto_level='CRITICAL')

try:
  my_region='us-east-1'
  pass
except Exception as e:
  helper.init_failure(e)

@helper.create
def create(event, context):
  application_id = event['ResourceProperties']['ApplicationId']
  logger.info('CREATE: %s', application_id)

  try:
    # 1. create the kinesis stream
    stream_arn = create_kinesis_stream(application_id)
    helper.Data['StreamArn'] = stream_arn

    # 2. create Pinpoint service role
    role_arn = create_pinpoint_role(application_id, stream_arn)
    helper.Data['PinpointRoleArn'] = stream_arn

    # 3. create Pinpoint event stream
    logger.info('Creating pinpoint stream:')
    logger.info('   Kinesis Stream ARN: %s', stream_arn)
    logger.info('   Role ARN: %s', role_arn)
    
    time.sleep(15) # not ideal, but waiting a moment solves for a consistency issue
    
    pinpoint_client = boto3.client('pinpoint', region_name=my_region)
    pinpoint_client.put_event_stream(
      ApplicationId=application_id,
      WriteEventStream={
        'DestinationStreamArn': stream_arn,
        'RoleArn': role_arn
      }
    )
  except ClientError as e:
    logging.error(e)
    raise e

  return None # auto generate a PhysicalResourceId

@helper.update
def update(event, context):
  logger.info('UPDATE')
  return True

@helper.delete
def delete(event, context):
  application_id = event['ResourceProperties']['ApplicationId']
  logger.info('DELETE: %s', application_id)
  
  try:
    detach_event_stream(application_id)
    logger.info('Deleting kinesis stream...')
    delete_kinesis_stream(application_id)
    logger.info('Deleting IAM role and policy...')
    delete_pinpoint_role(application_id)
    logger.info('DONE')
  except (ClientError, ParamValidationError, MissingParametersError) as e:
    logging.error(e)
    raise e


def handler(event, context):
  logger.info(json.dumps(event))
  my_region = get_region(os.environ['AWS_REGION'])
  logger.info(my_region)

  helper(event, context)


#######
def detach_event_stream(application_id):
  try:
    pinpoint_client = boto3.client('pinpoint', region_name=my_region)
    pinpoint_client.delete_event_stream(
      ApplicationId=application_id
    )
    
    logger.info('DONE')
  except (ClientError, ParamValidationError, MissingParametersError) as e:
    if e.response['Error']['Code'] == 'NotFoundException':
      logging.warn('Not found exception, skipping...')
      logging.warn(e)


#######
def create_kinesis_stream(application_id):
  client = boto3.client('kinesis', region_name=my_region)
  stream_name='event-stream-' + application_id
  create_stream_complete_waiter = client.get_waiter('stream_exists')

  try:
    kinesis = client.create_stream(
      StreamName=stream_name,
      ShardCount=1
    )
    create_stream_complete_waiter.wait(StreamName=stream_name)
    logger.info('Created Kinesis Stream')

    resp = client.describe_stream(StreamName=stream_name)
    return resp['StreamDescription']['StreamARN']
  except WaiterError as e:
    logging.error('Waiter expired to create stream')
    raise e

def delete_kinesis_stream(application_id):
  client = boto3.client('kinesis', region_name=my_region)
  stream_name='event-stream-' + application_id
  
  try:
    client.delete_stream(
      StreamName=stream_name,
      EnforceConsumerDeletion=True
    )
  except (ClientError, ParamValidationError, MissingParametersError) as e:
    if e.response['Error']['Code'] == 'NotFoundException':
      logging.warn('Not found exception, skipping...')
      logging.warn(e)


#######
def create_pinpoint_role(application_id, stream_arn):
  logger.info('Creating IAM Role for %s', stream_arn)
  client = boto3.client('iam')
  
  role_name = 'pinpoint-service-' + application_id + '-role'
  assume_role_policy = {
    'Version': '2012-10-17',
    'Statement': {
      'Effect': 'Allow',
      'Principal': {
        'Service': 'pinpoint.amazonaws.com'
      },
      'Action': 'sts:AssumeRole'
    }
  }
  
  policy_name = 'pinpoint-service-' + application_id + '-policy'
  policy = {
    'Version': '2012-10-17',
    'Statement': [
      {
        'Effect': 'Allow',
        'Action': [
          'kinesis:DescribeStream',
          'kinesis:PutRecords'
        ],
        'Resource': [ stream_arn ]
      },
      {
        'Effect': 'Allow',
        'Action': [
          'kinesis:PutRecord'
        ],
        'Resource': [ stream_arn+'/*' ]
      }
    ]
  }
  
  create_role_waiter = client.get_waiter('role_exists')
  resp = client.create_role(
    RoleName=role_name,
    AssumeRolePolicyDocument=json.dumps(assume_role_policy)
  )
  create_role_waiter.wait(RoleName=role_name)
  logging.info('Created IAM Role')

  create_policy_waiter = client.get_waiter('policy_exists')
  policy = client.create_policy(
    PolicyName=policy_name,
    PolicyDocument=json.dumps(policy)
  )
  create_policy_waiter.wait(PolicyArn=policy['Policy']['Arn'])
  logging.info('Created IAM Policy')
  
  client.attach_role_policy(
    RoleName=resp['Role']['RoleName'],
    PolicyArn=policy['Policy']['Arn']
  )


  return resp['Role']['Arn']

def delete_pinpoint_role(application_id):
  client = boto3.client('iam')
  
  role_name = 'pinpoint-service-' + application_id + '-role'
  policy_name = 'pinpoint-service-' + application_id + '-policy'
  policy_arn = 'arn:aws:iam::aws:policy/' + policy_name
  
  try:
    client.detach_role_policy(
      RoleName=role_name,
      PolicyArn=policy_arn
    )
    
    client.delete_policy(
      PolicyArn=policy_arn
    )
    
    client.delete_role(
      RoleName=role_name
    )
  except (ClientError, ParamValidationError, MissingParametersError) as e:
    if e.response['Error']['Code'] == 'NotFoundException':
      logging.warn('Not found exception, skipping...')
      logging.warn(e)

  

#######
def get_region(region):
  region_mapping = {
    'us-east-1': 'us-east-1',
    'us-east-2': 'us-east-1'
  }

  return region_mapping[region]
