const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Body length:', body.length);
    console.log('Contains font-awesome:', body.includes('font-awesome/6.4.0/css/all.min.css'));
    console.log('Contains quickAddAtrasoCard:', body.includes('quickAddAtrasoCard'));
    console.log('Contains quickAddExtraCard:', body.includes('quickAddExtraCard'));
    console.log('Contains addCardTimelineNote:', body.includes('addCardTimelineNote'));
    console.log('Contains smooth-shadow:', body.includes('smooth-shadow'));
  });
}).on('error', err => {
  console.error('Error fetching Vercel:', err.message);
});
