/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/index.html",
        "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1B3FA0",
                secondary: "#3D6EFF",
            }
        },
    },
    plugins: [],
}
