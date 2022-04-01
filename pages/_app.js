import "../styles/globals.css";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import { padWidth } from "../utils";

const theme = createTheme({
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Helvetica Neue",
      "PingFang SC",
      "Microsoft YaHei",
      "Source Han Sans SC",
      "Noto Sans CJK SC",
      "WenQuanYi Micro Hei",
      "Roboto",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
  },
  palette: {
    primary: {
      main: "#000",
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          padding: 0,
          margin: "0 !important",
          background: "transparent",
        },
      },
    },
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
