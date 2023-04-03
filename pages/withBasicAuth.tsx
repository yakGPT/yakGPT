import { NextPage, NextPageContext } from "next";

export default function withBasicAuth(WrappedComponent: NextPage) {
  const WithBasicAuth: NextPage = (props) => {
    return <WrappedComponent {...props} />;
  };

  WithBasicAuth.getInitialProps = async (ctx: NextPageContext) => {
    const username = process.env.AUTH_USER;
    const password = process.env.AUTH_PASS;

    console.log("Using: ", username, password);

    const auth = ctx.req?.headers.authorization;

    if (!auth || auth.indexOf("Basic ") !== 0) {
      returnUnauthorized(ctx.res);
    } else {
      const base64Credentials = auth.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "ascii"
      );
      const [user, pass] = credentials.split(":");

      if (user !== username || pass !== password) {
        returnUnauthorized(ctx.res);
      }
    }

    const componentProps =
      WrappedComponent.getInitialProps &&
      (await WrappedComponent.getInitialProps(ctx));

    return { ...componentProps };
  };

  function returnUnauthorized(res: NextPageContext["res"]) {
    if (res) {
      res.setHeader("WWW-Authenticate", "Basic realm=\"Authorization required\"");
      res.statusCode = 401;
      res.end("Access denied");
    }
  }

  return WithBasicAuth;
}
