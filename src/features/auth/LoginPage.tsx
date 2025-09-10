import { Box, Button, Container, Typography, Alert } from "@mui/material";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useAuthStore } from "./store";

export default function LoginPage() {
  const {
    isLoading,
    error,
    setLoading,
    setError,
    setUserFromFirebase,
    setAccessToken,
  } = useAuthStore();

  const onGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken ?? null;
      setAccessToken(token);
      setUserFromFirebase(result.user);
      window.location.href = "/app";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      const friendly = message.includes("popup-closed-by-user")
        ? "Sign-in was cancelled. Please try again."
        : message.includes("auth/network-request-failed")
        ? "Network error. Check your connection and try again."
        : "Unable to sign in. Please try again.";
      setError(friendly);
      // eslint-disable-next-line no-console
      console.error("Google sign-in error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Container maxWidth="sm">
        <Box textAlign="center">
          <Typography 
            variant="h4" 
            fontWeight={700} 
            gutterBottom
            sx={{ color: "#424242" }} // Dark grey instead of black
          >
            Biblion
          </Typography>
          <Typography 
            color="text.secondary" 
            gutterBottom
            sx={{ color: "#757575" }} // Lighter grey
          >
            Your AI-powered smart note-taking app
          </Typography>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          <Button
            variant="contained"
            onClick={onGoogleSignIn}
            disabled={isLoading}
            sx={{
              mt: 2,
              backgroundColor: "#FFEB3B", // Bright yellow background
              color: "#424242", // Dark grey text instead of black
              borderRadius: 2,
              px: 3,
              py: 1.25,
              ":hover": { backgroundColor: "#FDD835" },
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {/* Custom Google 'G' icon - white on dark grey background */}
            <Box
              sx={{
                width: 20,
                height: 20,
                backgroundColor: "#424242",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              G
            </Box>
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
