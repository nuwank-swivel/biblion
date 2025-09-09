import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Box, Button, Container, Toolbar, Typography, } from "@mui/material";
export default function HomePage() {
    return (_jsxs(Box, { children: [_jsx(AppBar, { position: "static", children: _jsxs(Toolbar, { children: [_jsx(Typography, { variant: "h6", sx: { flexGrow: 1 }, children: "Biblion" }), _jsx(Button, { color: "inherit", href: "/login", children: "Logout" })] }) }), _jsxs(Container, { sx: { py: 4 }, children: [_jsx(Typography, { variant: "h5", children: "Welcome" }), _jsx(Typography, { color: "text.secondary", children: "App shell ready." })] })] }));
}
