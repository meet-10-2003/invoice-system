export default async function saveJobSheetToSheet(data) {
    const response = await fetch('https://invoice-proxy.onrender.com/save-job-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to save job sheet');
    }

    return await response.json();
}
