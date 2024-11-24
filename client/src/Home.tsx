import Page from "./dawn-ui/components/Page";
import Navbar from "./dawn-ui/components/Navbar";
import Row from "./dawn-ui/components/Row";
import Container from "./dawn-ui/components/Container";
import Button from "./dawn-ui/components/Button";

export default function App() {
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
        <Container title="Kairo">
          Kairo is your personal journel featuring a mood tracker and highly
          functional to-dos.
          <Row>
            <Button big onClick={() => (window.location.href = "/app")}>
              Open App
            </Button>
            <Button big onClick={() => (window.location.href = "/login")}>
              Sign Up
            </Button>
          </Row>
        </Container>
      </Page>
    </>
  );
}
