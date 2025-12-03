# Movie 5 Years Later

A React + Vite web application.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 16.x or higher recommended)
- **npm** (comes with Node.js) or **yarn**

You can verify your installations by running:
```bash
node --version
npm --version
```

## Installation

Follow these steps to set up the project locally:

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd movie5yearslater
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   This will install all required packages listed in `package.json`, including:
   - React 19.2.0
   - React DOM 19.2.0
   - Vite 7.2.4
   - ESLint and related plugins

## Initialization & Running the Application

### Development Mode

To start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use). The dev server will automatically reload when you make changes to your code.

### Build for Production

To create an optimized production build:

```bash
npm run build
```

The built files will be output to the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

### Linting

To run ESLint and check for code quality issues:

```bash
npm run lint
```

## Project Structure

```
movie5yearslater/
├── public/          # Static assets
├── src/             # Source files
│   ├── components/  # React components
│   ├── index.css    # Global styles
│   └── main.jsx     # Application entry point
├── index.html       # HTML template
├── package.json     # Project dependencies and scripts
├── vite.config.js   # Vite configuration
└── README.md        # This file
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

## Technology Stack

- **React 19.2.0** - UI library
- **Vite 7.2.4** - Build tool and dev server
- **ESLint** - Code linting and quality checks
- **@vitejs/plugin-react** - Fast Refresh using Babel

## Troubleshooting

If you encounter any issues:

1. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   ```

3. **Check Node.js version**: Ensure you're using Node.js 16.x or higher

## Learn More

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [ESLint Documentation](https://eslint.org/)
