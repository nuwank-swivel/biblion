import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";

export default function HomePage() {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Biblion
          </Typography>
          <Button color="inherit" href="/login">
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        <Typography variant="h5">Welcome</Typography>
        <Typography color="text.secondary">App shell ready.</Typography>
      </Container>
    </Box>
  );
}
