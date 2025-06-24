export default async function saveJobSheetToSheet(data) {
    const response = await fetch('http://localhost:3001/save-job-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to save job sheet');
    }

    return await response.json();
}
