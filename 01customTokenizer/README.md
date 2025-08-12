# Token Hover Peek
An interactive text tokenizer visualization tool that helps you understand how different AI models break down text into tokens. Perfect for developers working with Large Language Models (LLMs) who need to analyze token usage, optimize prompts, or understand tokenization patterns.

## Live Demo: [gen-ai-in-js-cohort.vercel.app](https://gen-ai-in-js-cohort.vercel.app)

### Features

- **Interactive Tokenization**: Visualize how text gets broken down into tokens in real-time
- **Multiple Model Support**: Support for GPT-4, GPT-3.5-turbo, and custom tokenizers
- **Hover to Explore**: Hover over tokens to see their position in the original text
- **Token Statistics**: View character count, token count, and characters-per-token ratio
- **Custom Tokenizers**: Create and test your own tokenization schemes
- **Dual View Modes**: Toggle between viewing actual tokens and their numeric IDs
- **Dark/Light Theme**: Modern UI with theme switching support
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- React 19 - Modern React with latest features
- Vite - Fast build tool and development server
- TailwindCSS 4 - Utility-first CSS framework
- Radix UI - Accessible component primitives
- js-tiktoken - JavaScript implementation of OpenAI's tiktoken
- React Router - Client-side routing
- React Query - Data fetching and state managemen

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18.0 or higher)
- npm package manager
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <https://github.com/sarthakg043/GenAI-in-JS-Cohort>
cd GenAI-in-JS-Cohort/01customTokenizer
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

### 3. Start Development Server

Using npm:
```bash
npm run dev
```

The application will start and be available at `<http://localhost:5173>`

### 4. Build for Production (Optional)


To create a production build:

Using npm:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## 📖 How to Use

### Main Interface

![](https://res.cloudinary.com/daibyzipc/image/upload/v1755022851/Screenshot_2025-08-12_at_11.50.42_PM_lixd34.png)

The application features a three-panel layout:

1. Original Text Panel (Left): Enter or paste your text here
2. Tokenized Output Panel (Center): Visual representation of tokens
3. Token Details Panel (Right): Detailed list of all tokens with IDs

### Basic Tokenization

1. Enter Text: Type or paste your text in the "Original Text" panel
2. View Tokens: See how the text is broken down in the "Tokenized Output" panel
3. Explore Details: Check the "Token Details" panel for token IDs and character counts
4. Interactive Hover: Hover over any token to see its position highlighted in the original text

### Model Selection

1. Click the **Model Selector** dropdown in the control panel
2. Choose from available models:
   - **GPT-4 / GPT-3.5-turbo** (cl100k_base encoding)
   - **Custom tokenizers** (if any have been created)
3. The tokenization will automatically update based on your selection

### Creating Custom Tokenizers

1. Click the "Create Custom Tokenizer" button
2. Name Your Tokenizer: Give it a descriptive name
3. Add Tokens: Enter tokens one by one (each on a new line or separated by commas)
4. Save: Your custom tokenizer will be available in the model selector
5. Test: Select your custom tokenizer and see how it performs

### View Modes

- Token Text Mode (Default): Shows the actual token content
- Token ID Mode: Shows numeric token IDs instead
- Use the toggle switch in the "Tokenized Output" panel header to switch between modes

### Understanding Token Statistics
The statistics bar shows:

- Characters: Total character count in your input
- Tokens: Number of tokens generated
- Chars/Token: Average characters per token (efficiency metric)

### Theme Switching

- Click the theme toggle button (sun/moon icon) in the top-right corner
- Switch between light, dark, and system theme modes
- Theme preference is saved in local storage

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues]([https://github.com/sarthakg043/GenAI-in-JS-Cohort/issues](https://github.com/sarthakg043/GenAI-in-JS-Cohort)) section
2. Create a new issue with detailed description
3. Include browser information and steps to reproduce

---
Made with ❤️ for the AI development community