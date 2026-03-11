/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/renderer/src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: "#1B3FA0",
                    light: "#3D6EFF",
                    muted: "#A8C4FF",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
};
