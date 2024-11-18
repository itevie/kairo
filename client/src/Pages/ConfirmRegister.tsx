import { useMemo } from "react";
import Container from "../dawn-ui/components/Container";
import Navbar from "../dawn-ui/components/Navbar";
import Page from "../dawn-ui/components/Page";
import Row from "../dawn-ui/components/Row";
import Button from "../dawn-ui/components/Button";
import { apiUrl } from "./Login";

export default function ConfirmRegister() {
  const [scheme, access_token, path] = useMemo(() => {
    const query = new URLSearchParams(window.location.search.toString());
    if (
      !query.get("path") ||
      !query.get("scheme") ||
      !query.get("access_token")
    )
      window.location.href = "/";
    return [query.get("scheme"), query.get("access_token"), query.get("path")];
  }, []);

  return (
    <>
      <Navbar title="Kairo" breadcrumb />
      <Page>
        <Container title="Confirm Registration">
          <label>
            It seems you don't have an account yet, would you like to associate
            one with your {scheme} account?
          </label>
          <Row>
            <Button big onClick={() => (window.location.href = "/")}>
              Take me home
            </Button>
            <Button
              big
              onClick={() => {
                window.location.replace(
                  `${apiUrl}${path}?access-token=${access_token}&register=true`
                );
              }}
            >
              Register
            </Button>
          </Row>
        </Container>
      </Page>
    </>
  );
}
