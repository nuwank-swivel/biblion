import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { theme } from "./theme";
// import { startupValidator } from "../lib/startup-validation";
import { logger } from "../lib/logger";
import "./index.css";
import { startupValidator } from "../lib/startup-validation";

// Perform startup validation before rendering the app
async function initializeApp() {
  try {
    logger.info("Initializing Biblion application");

    // Perform startup validation
    const validationResult = await startupValidator.validateStartup();

    if (!validationResult.isValid) {
      logger.error("Application startup validation failed", undefined, {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });

      // Show error message to user
      const rootElement = document.getElementById("root");
      if (rootElement) {
        rootElement.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            text-align: center;
          ">
            <h1 style="color: #d32f2f; margin-bottom: 20px;">Application Configuration Error</h1>
            <p style="margin-bottom: 20px; max-width: 600px;">
              The application failed to start due to configuration issues. Please check the following:
            </p>
            <ul style="text-align: left; max-width: 600px; margin-bottom: 20px;">
              ${validationResult.errors
                .map((error) => `<li style="margin-bottom: 8px;">${error}</li>`)
                .join("")}
            </ul>
            ${
              validationResult.warnings.length > 0
                ? `
              <p style="margin-bottom: 10px; font-weight: bold;">Warnings:</p>
              <ul style="text-align: left; max-width: 600px; margin-bottom: 20px;">
                ${validationResult.warnings
                  .map(
                    (warning) =>
                      `<li style="margin-bottom: 8px; color: #f57c00;">${warning}</li>`
                  )
                  .join("")}
              </ul>
            `
                : ""
            }
            <p style="color: #666; font-size: 14px;">
              Please contact support if this issue persists.
            </p>
          </div>
        `;
      }
      return;
    }

    // If validation passes, render the app
    renderApp();
  } catch (error) {
    logger.error("Failed to initialize application", error as Error);

    // Show generic error message
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          text-align: center;
        ">
          <h1 style="color: #d32f2f; margin-bottom: 20px;">Application Error</h1>
          <p style="margin-bottom: 20px;">
            An unexpected error occurred while starting the application.
          </p>
          <p style="color: #666; font-size: 14px;">
            Please refresh the page or contact support if this issue persists.
          </p>
        </div>
      `;
    }
  }
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
}

// Initialize the application
initializeApp();
