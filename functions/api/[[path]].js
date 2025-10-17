// functions/api/[[path]].js

/**
 * Responds to any requests to /api/*.
 * This is our main backend router.
 */
export async function onRequest(context) {
  // Get the LegiScan API key from our environment variables (secrets).
  // We'll set this up in the Cloudflare dashboard later.
  const LEGISCAN_API_KEY = context.env.LEGISCAN_API_KEY;

  // Get the KV namespace we created and bound.
  const kv = context.env.LEGI_KV;

  // Determine what to do based on the URL path.
  const url = new URL(context.request.url);
  if (url.pathname === '/api/bills') {
    return await handleGetBills(kv);
  }
  if (url.pathname === '/api/sync') {
    return await handleSync(kv, LEGISCAN_API_KEY);
  }

  return new Response('Not Found', { status: 404 });
}

/**
 * Fetches the latest bills from LegiScan and stores them in KV.
 * This is an endpoint we can call to refresh our data.
 */
async function handleSync(kv, apiKey) {
  try {
    // You can customize this search query!
    // Example: Search for bills related to "broadband" in the current session of the US Congress.
    const legiscanUrl = `https://api.legiscan.com/?key=${apiKey}&op=getSearch&state=US&query=broadband`;

    const response = await fetch(legiscanUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch from LegiScan API');
    }

    const data = await response.json();
    const bills = data.searchresult;

    // The LegiScan API returns a mix of metadata and bill objects.
    // This line filters to keep only the actual bill objects.
    const billObjects = Object.values(bills).filter(item => typeof item === 'object');

    // Store each bill in KV using its bill_id as the key.
    for (const bill of billObjects) {
      // We prefix the key with 'bill:' to keep our data organized.
      await kv.put(`bill:${bill.bill_id}`, JSON.stringify(bill));
    }

    return new Response(JSON.stringify({ success: true, message: `Synced ${billObjects.length} bills.` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Gets all the bills we've stored in our KV.
 */
async function handleGetBills(kv) {
  // List all keys that start with the "bill:" prefix.
  const list = await kv.list({ prefix: 'bill:' });

  // Fetch all the values for the keys we found.
  const promises = list.keys.map(key => kv.get(key.name, { type: 'json' }));
  const bills = await Promise.all(promises);

  return new Response(JSON.stringify(bills), {
    headers: { 'Content-Type': 'application/json' },
  });
}