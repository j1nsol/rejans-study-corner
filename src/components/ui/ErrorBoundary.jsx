import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Rejan's Study Corner crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
          <p className="text-4xl">🥺</p>
          <p className="mt-3 font-display text-lg text-stone-600">
            Oops! Something went wrong.
          </p>
          <p className="mt-1 text-sm text-stone-400">
            Don't worry, your study space is still here. Try refreshing! 💗
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
