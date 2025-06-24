const PROXY_URL = 'https://invoice-proxy.onrender.com';

const saveInvoiceToSheet = async (data, sheetName = '') => {
  try {
    const url = `${PROXY_URL}/save-invoice?sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }), // ✅ this is the fix
    });

    if (!response.ok) {
      throw new Error('Failed to save invoice data');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving invoice:', error);
    throw error;
  }
};





const deletePreviousInvoice = async (orderNo, vendor) => {
  try {
    console.log('Deleting order:', orderNo, vendor); // ✅ Fixed variable name

    const response = await fetch('${PROXY_URL}/delete-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderNo, // ✅ This will map to "Order No" on the server side
        vendor,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
    console.error('Server responded with:', errorText);
    throw new Error('Failed to delete invoice');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};




export { saveInvoiceToSheet, deletePreviousInvoice };

