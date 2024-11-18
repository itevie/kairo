import Button from "../dawn-ui/components/Button";
import Container from "../dawn-ui/components/Container";
import Navbar from "../dawn-ui/components/Navbar";
import Page from "../dawn-ui/components/Page";
import Row from "../dawn-ui/components/Row";

export default function Welcome() {
  return (
    <>
      <Navbar title="Kairo" breadcrumb>
        <Row>
          <Button onClick={() => (window.location.href = "/app")}>
            Open App
          </Button>
        </Row>
      </Navbar>
      <Page>
        <Container title="Welcome to Kairo">
          <label>Welcome to your new todo app!</label>
          <Button big onClick={() => (window.location.href = "/app")}>
            Open App
          </Button>
        </Container>
      </Page>
    </>
  );
}
