# Western Australia 3D Sites Viewer

A web-based application to explore various 3D rendered sites in Western Australia, built using Three.js.

## Features

*   Interactive 3D viewing of multiple sites.
*   Navigation controls (previous/next site, direct site selection).
*   Dynamic site descriptions.
*   Loading indicators and error handling.
*   Responsive design for different screen sizes.
*   Skybox and environment mapping for realistic rendering.
*   Post-processing effects (Bloom, Bokeh).

## Getting Started

### Prerequisites

*   A modern web browser with WebGL support (e.g., Chrome, Firefox, Safari, Edge).
*   Node.js and npm (for development and running tests).

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install development dependencies:
    ```bash
    npm install
    ```

### Running the Project

*   Open the `index.html` file in a web browser.
*   For development, a local web server (e.g., Live Server extension in VS Code, or `python -m http.server`) might be necessary for some features like loading local files (models, textures) due to browser security restrictions (CORS).

## Usage Examples

*   **Navigation Buttons:** Use the "Previous Site" and "Next Site" buttons to cycle through the available 3D sites.
*   **Direct Site Selection:** Click on the numbered buttons (e.g., "Site 1", "Site 2") to jump directly to a specific site.
*   **Keyboard Shortcuts:** Use the number keys (1, 2, 3, etc.) on your keyboard to quickly switch to the corresponding site.
*   **Site Information:** Information and a brief description of the currently viewed site are displayed alongside the 3D view.

## Bug Scanning and Fixing

### Browser Developer Tools

If you encounter issues, open your browser's developer console (usually by pressing F12). Check for any error messages, which can provide clues about what's going wrong.

### Testing with Jest

This project uses Jest for JavaScript testing.

*   **Run tests:**
    ```bash
    npm test
    ```
*   We encourage writing new tests for any new features or bug fixes to maintain code quality. Test files are typically located in a `__tests__` directory or have a `.test.js` or `.spec.js` extension.

## CI/CD Pipeline Setup

Continuous Integration/Continuous Deployment (CI/CD) helps automate the development process.

### General Best Practices

*   **Automate Everything:** Automate tests, builds, and deployments.
*   **Version Control:** Use Git for version control, with meaningful commit messages and branches for new features/fixes.
*   **Linting and Code Style:** Use tools like ESLint or Prettier to maintain consistent code style and catch potential errors early.

### Example CI/CD Setup (GitHub Actions)

Create a workflow file in your repository, for example, at `.github/workflows/main.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18' # Specify your Node.js version

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm test
```

## Contributing

Contributions are welcome! Please feel free to fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the ISC License. See the `LICENSE` file for details.
