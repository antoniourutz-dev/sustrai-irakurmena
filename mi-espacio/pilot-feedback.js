'use strict';
/* HitzBira — optional pilot feedback, only in Nire espazioa. */
(() => {
  const $ = id => document.getElementById(id);
  const section = $('pilotFeedback');
  const form = $('pilotFeedbackForm');
  if (!section || !form) return;
  const status = $('pilotFeedbackStatus');
  const submit = $('pilotFeedbackSubmit');
  const message = $('pilotFeedbackComment');
  let client;
  async function start() {
    const cloud = window.SustraiCloud;
    if (!cloud) return;
    await cloud.ready;
    const profile = cloud.profile();
    const user = cloud.user();
    client = cloud.client();
    if (!profile?.active || !user?.id || !client) return;
    const {data, error} = await client.from('smx_aditzak_pilot_members')
      .select('enabled').eq('user_id', user.id).eq('enabled', true)
      .eq('member_role', 'tester').maybeSingle();
    if (error || !data?.enabled) return;
    section.hidden = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled) return;
      const comment = message.value.trim();
      if (comment.length < 10 || comment.length > 2000) {
        status.textContent = 'Idatzi 10 eta 2.000 karaktere arteko iruzkina.';
        message.focus();
        return;
      }
      const rating = $('pilotFeedbackRating').value;
      const payload = {
        category: 'iradokizuna',
        feedback_area: $('pilotFeedbackArea').value,
        comment_eu: comment,
        rating: rating ? Number(rating) : null
      };
      submit.disabled = true;
      status.textContent = 'Bidaltzen…';
      try {
        const {error} = await client.from('hb_pilot_feedback').insert(payload);
        if (error) throw error;
        form.reset();
        status.textContent = 'Eskerrik asko! Zure iritzia jaso dugu.';
      } catch (_) {
        status.textContent = 'Ezin izan da iritzia bidali. Saiatu berriro; zure testua ez da ezabatu.';
      } finally {
        submit.disabled = false;
      }
    });
  }
  start().catch(() => { section.hidden = true; });
})();
