import Page from "../dawn-ui/components/Page";
import Navbar from "../dawn-ui/components/Navbar";
import Row from "../dawn-ui/components/Row";
import Container from "../dawn-ui/components/Container";
import Button from "../dawn-ui/components/Button";
import Link from "../dawn-ui/components/Link";

export const apiUrl = "https://kairo.dawn.rest";

export default function Login() {
  return (
    <>
      <Navbar title="Kairo" breadcrumb>
        <Row>
          <Button>Hello</Button>
        </Row>
      </Navbar>
      <Page>
        <Container title="Login to Kairo">
          <Link href={`https://auth.dawn.rest/oauth?cb=${apiUrl}/auth/dawn`}>
            <Button big>Login with dawn.rest</Button>
          </Link>
        </Container>
      </Page>
    </>
  );
}
