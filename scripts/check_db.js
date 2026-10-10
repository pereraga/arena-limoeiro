const url = "https://brmclyukjfijommbxhks.supabase.co/rest/v1";
const key = "sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7";

async function check() {
  try {
    const r1 = await fetch(url + "/bookings?select=*", { headers: { apikey: key, Authorization: "Bearer " + key } });
    const bookings = await r1.json();
    console.log("=== BOOKINGS IN SUPABASE (" + (bookings.length || 0) + ") ===");
    console.log(JSON.stringify(bookings, null, 2));

    const r2 = await fetch(url + "/monthly_members?select=*", { headers: { apikey: key, Authorization: "Bearer " + key } });
    const monthly = await r2.json();
    console.log("=== MONTHLY MEMBERS IN SUPABASE (" + (monthly.length || 0) + ") ===");
    console.log(JSON.stringify(monthly, null, 2));
  } catch(e) {
    console.error(e);
  }
}
check();
