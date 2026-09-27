// Test the streaming API from your terminal (the dev server must be running):
//   node scripts/ask.mjs "What is retrieval-augmented generation?"
const query = process.argv.slice(2).join(" ") || "What is retrieval-augmented generation?";
const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

const res = await fetch(`${baseUrl}/api/ask`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

if (!res.ok || !res.body) {
  console.error(`HTTP ${res.status}:`, await res.text());
  process.exit(1);
}

const decoder = new TextDecoder();
let buffer = "";
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    const event = JSON.parse(line);
    if (event.type === "sources") {
      console.log("SOURCES");
      for (const s of event.sources) console.log(`  [${s.id}] ${s.title}\n      ${s.url}`);
      console.log("\nANSWER");
    } else if (event.type === "token") {
      process.stdout.write(event.text);
    } else if (event.type === "related") {
      console.log("\n\nRELATED");
      for (const q of event.questions) console.log(`  • ${q}`);
    } else if (event.type === "error") {
      console.error(`\nERROR: ${event.message}`);
    }
  }
}
console.log();
