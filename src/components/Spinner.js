import { jsx as _jsx } from "react/jsx-runtime";
import { Box, CircularProgress } from "@mui/material";
export function Spinner() {
    return (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", children: _jsx(CircularProgress, {}) }));
}
