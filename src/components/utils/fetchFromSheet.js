export default async function fetchFromSheet() {
  const response = await fetch(
    "https://opensheet.elk.sh/1aHdnjnvQG_S5uVbUWhKJNLz8Ea2GtSteBPWLyijO-6Y/Sheet1"
  );

  //   const response = await fetch(
  //   "https://opensheet.elk.sh/1SfrvfRf_IzGCevonuMG5-mYISF9jWqV22cZDlY5EMsY/Sheet1"
  // );

  
  const data = await response.json();

  const cleanData = data.map(item => ({
    vendor: item.vendor?.trim(),
    name: item.name?.trim(),
    description: item.description?.trim(),
    image: item.image?.trim(),
    price: parseFloat(item.price) || 0
  }));

  return cleanData;
}
