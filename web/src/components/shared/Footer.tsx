import React from 'react';

import { Container, Grid, Image, List  } from 'semantic-ui-react';

const Footer = () => {
  function currentYear() {
    return new Date().getUTCFullYear();
  }

  return (
    <footer>
      <Container>
        <Grid centered>
          <Grid.Row>
            <Image src="/aws.png" size="mini" />
          </Grid.Row>
          <Grid.Row>
            <List horizontal divided size="small">
              <List.Item>Help</List.Item>
              <List.Item>Support</List.Item>
              <List.Item>Contact</List.Item>
            </List>
          </Grid.Row>
          <Grid.Row>
            <p>&copy; 2019-{ `${currentYear()}` } - This site is for demonstration purposes only.</p>
          </Grid.Row>
        </Grid>
      </Container>
    </footer>
  );
}

export default Footer;
