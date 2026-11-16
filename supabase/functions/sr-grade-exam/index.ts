// SUSTRAI Irakurmena: grade published exams without exposing the official answer key in bulk.
// Authorization is verified by the Supabase gateway (verify_jwt=true).
const OK_ORIGIN = /^https:\/\/sustrai-irakurmena(?:-[a-z0-9-]+)?\.vercel\.app$/i;
const headers = (origin: string) => ({
  "Access-Control-Allow-Origin": OK_ORIGIN.test(origin) ? origin : "https://sustrai-irakurmena.vercel.app",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
});
const json = (value: unknown, status: number, origin: string) =>
  new Response(JSON.stringify(value), { status, headers: headers(origin) });
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "";
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
  if (origin && !OK_ORIGIN.test(origin)) return json({ error: "origin_not_allowed" }, 403, origin);
  try {
    const bodyText = await request.text();
    if (bodyText.length > 30000) return json({ error: "request_too_large" }, 413, origin);
    const body = JSON.parse(bodyText);
    const slug = body?.slug;
    const answers = body?.answers;
    if (typeof slug !== "string" || !/^(?:ivap|habe)-[A-Za-z0-9][A-Za-z0-9-]{2,70}$/.test(slug))
      return json({ error: "invalid_exam" }, 400, origin);
    if (!answers || typeof answers !== "object" || Array.isArray(answers) ||
        Object.keys(answers).length > 6 ||
        !Object.values(answers).every(task => task && typeof task === "object" && !Array.isArray(task) &&
           Object.keys(task).length <= 40 &&
           Object.values(task).every(v => typeof v === "string" && /^[A-J]?$/.test(v))))
      return json({ error: "invalid_answers" }, 400, origin);

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !url) return json({ error: "backend_unavailable" }, 503, origin);
    // Access rules are checked with the caller's JWT; the service role is never used for authorizing users.
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || request.headers.get("apikey") || "";
    const caller = request.headers.get("authorization") || "";
    const access = await fetch(url + "/rest/v1/rpc/sr_can_read_exam_slug", {
      method: "POST",
      headers: {"apikey":anonKey, "Authorization":caller, "Content-Type":"application/json"},
      body: JSON.stringify({p_slug:slug})
    });
    if (!access.ok) return json({error:"access_check_failed"}, access.status===401?401:503, origin);
    if ((await access.json()) !== true) return json({error:"access_denied"},403,origin);
    const backend = await fetch(url + "/rest/v1/rpc/sr_grade_exam", {
      method: "POST",
      headers: { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_exam_slug: slug, p_answers: answers }),
    });
    if (!backend.ok) return json({ error: "grading_failed" }, 502, origin);
    const result = await backend.json();
    if (!result || !Array.isArray(result.items)) return json({ error: "exam_unavailable" }, 404, origin);
    // Minimal disclosure: every item says whether the given answer is right, but the accepted
    // options are only returned in practice mode and only for questions the student answered.
    // A simulation never receives solutions, and an empty submission can no longer read the key.
    const mode = body?.mode === "simulation" ? "simulation" : "practice";
    const items = result.items.map((row: { position: number; n: number; accepted?: unknown }) => {
      const given = answers[String(row.position)]?.[String(row.n)] ?? "";
      const accepted = Array.isArray(row.accepted) ? row.accepted : [];
      const item: Record<string, unknown> = {
        position: row.position, n: row.n, correct: given !== "" && accepted.includes(given),
      };
      if (mode === "practice" && given !== "") item.accepted = accepted;
      return item;
    });
    const graded = {
      slug: result.slug, score: result.score, max_score: result.max_score,
      correct: result.correct, answered: result.answered, total: result.total, items,
    };
    let saved = false;
    if (body?.finalize === true) {
      const key = body?.clientAttemptKey;
      const elapsed = body?.elapsedSeconds;
      if (typeof key!=="string" || !/^sustrai-[a-f0-9-]{36}$/.test(key) ||
          !Number.isInteger(elapsed) || elapsed<0 || elapsed>86400)
        return json({error:"invalid_attempt"},400,origin);
      // A guest may take the same exam; persistent trusted results are only for signed-in users.
      if (caller && caller !== "Bearer " + anonKey) {
        const account = await fetch(url + "/auth/v1/user", {
          headers: {"apikey":anonKey,"Authorization":caller}
        });
        if (!account.ok) return json({error:"auth_unavailable"},503,origin);
        const user = await account.json();
        if (!user?.id || !user?.email_confirmed_at)
          return json({error:"verified_account_required"},403,origin);
        const examResponse=await fetch(url+"/rest/v1/sr_exams?select=id&slug=eq."+encodeURIComponent(slug)+"&limit=1",{
          headers: {"apikey":serviceKey,"Authorization":"Bearer "+serviceKey}
        });
        if(!examResponse.ok)return json({error:"exam_lookup_failed"},503,origin);
        const examRows=await examResponse.json();
        if(!examRows.length)return json({error:"exam_unavailable"},404,origin);
        const item={
          user_id:user.id,exam_id:examRows[0].id,
          client_attempt_key:key,
          score:result.score,max_score:result.max_score,
          correct:result.correct,total:result.total,elapsed_seconds:elapsed,
          response_summary:{mode}
        };
        const recorded=await fetch(url+"/rest/v1/sr_app_reading_results",{
          method:"POST",
          headers:{"apikey":serviceKey,"Authorization":"Bearer "+serviceKey,
            "Content-Type":"application/json","Prefer":"resolution=ignore-duplicates,return=minimal"},
          body:JSON.stringify(item)
        });
        if(!recorded.ok)return json({error:"result_save_failed"},503,origin);
        saved=true;
      }
    }
    return json({...graded,saved}, 200, origin);
  } catch {
    return json({ error: "invalid_request" }, 400, origin);
  }
});
