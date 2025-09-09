import { Box, CircularProgress } from "@mui/material";

export function Spinner() {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="40vh"
    >
      <CircularProgress />
    </Box>
  );
}
