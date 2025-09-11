import { ReactNode } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { logger } from "../lib/logger";
import {
  ErrorBoundary as ReactErrorBoundary,
  FallbackProps,
} from "react-error-boundary";

type Props = { children: ReactNode };

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box textAlign="center">
        <Typography variant="h5" gutterBottom color="error">
          Something went wrong
        </Typography>
        <Typography color="text.secondary" paragraph>
          We encountered an unexpected error. Please try refreshing the page or
          contact support if the problem persists.
        </Typography>
        <Button variant="contained" onClick={resetErrorBoundary}>
          Try Again
        </Button>
        {import.meta.env.DEV && error && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography
              variant="caption"
              component="pre"
              sx={{ textAlign: "left" }}
            >
              {String(error)}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export function ErrorBoundary({ children }: Props) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        const errorContext = {
          componentStack: info?.componentStack,
          errorBoundary: true,
          timestamp: new Date().toISOString(),
        };
        if (error instanceof Error) {
          logger.logError(error, errorContext);
        } else {
          logger.error("ErrorBoundary caught non-Error object", undefined, {
            ...errorContext,
            errorType: typeof error,
            errorValue: String(error),
          });
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
