import { Box, Button, Container, Typography } from "@mui/material";

export default function LoginPage() {
  const onGoogleSignIn = () => {
    // Placeholder; real auth added in Story 1.2
    window.location.href = "/app";
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 12 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Biblion
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Sign in to continue
        </Typography>
        <Button variant="contained" onClick={onGoogleSignIn}>
          Continue with Google
        </Button>
      </Box>
    </Container>
  );
}
