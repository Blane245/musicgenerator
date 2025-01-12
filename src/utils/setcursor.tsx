export default function setCursor (cursor: string): void {
    const page = document.getElementById('page');
    if (page) page.style.cursor = cursor;
}