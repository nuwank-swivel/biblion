import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Container, Typography } from "@mui/material";
export default function LoginPage() {
    const onGoogleSignIn = () => {
        // Placeholder; real auth added in Story 1.2
        window.location.href = "/app";
    };
    return (_jsx(Container, { maxWidth: "sm", sx: { mt: 12 }, children: _jsxs(Box, { textAlign: "center", children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Biblion" }), _jsx(Typography, { color: "text.secondary", gutterBottom: true, children: "Sign in to continue" }), _jsx(Button, { variant: "contained", onClick: onGoogleSignIn, children: "Continue with Google" })] }) }));
}
