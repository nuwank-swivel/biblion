import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { signOut } from "firebase/auth";
import { auth } from "../features/auth/firebase";
import { useAuthStore } from "../features/auth/store";

export default function HomePage() {
  const { user, reset } = useAuthStore();

  const onLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      reset();
      window.location.href = "/login";
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Biblion
          </Typography>
          {user ? (
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? undefined}
              />
              <Typography variant="body2">
                {user.displayName ?? user.email}
              </Typography>
              <Button color="inherit" onClick={onLogout}>
                Logout
              </Button>
            </Box>
          ) : null}
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        <Typography variant="h5">Welcome</Typography>
        <Typography color="text.secondary">App shell ready.</Typography>
      </Container>
    </Box>
  );
}
