/**
 * แปลง URL วิดีโอจากแพลตฟอร์มต่าง ๆ ให้เป็น embed URL
 * @param {string} url - URL วิดีโอที่ผู้ใช้กรอก
 * @returns {string} - embed URL ที่ใช้ใน iframe ได้
 */
export function convertVideoUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmedUrl = url.trim();

  // --- YouTube ---
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://youtube.com/shorts/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID (อยู่แล้ว)
  if (trimmedUrl.includes('youtube.com/embed/')) {
    return trimmedUrl;
  }
  
  const ytWatchMatch = trimmedUrl.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;
  }
  
  const ytShortMatch = trimmedUrl.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytShortMatch) {
    return `https://www.youtube.com/embed/${ytShortMatch[1]}`;
  }
  
  const ytShortsMatch = trimmedUrl.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  if (ytShortsMatch) {
    return `https://www.youtube.com/embed/${ytShortsMatch[1]}`;
  }

  // --- Vimeo ---
  // https://vimeo.com/VIDEO_ID
  // https://player.vimeo.com/video/VIDEO_ID (อยู่แล้ว)
  if (trimmedUrl.includes('player.vimeo.com/video/')) {
    return trimmedUrl;
  }
  
  const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/)([0-9]+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // --- Google Drive ---
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  if (trimmedUrl.includes('drive.google.com/file/d/')) {
    const gdMatch = trimmedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (gdMatch) {
      return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    }
  }
  
  const gdOpenMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gdOpenMatch && trimmedUrl.includes('drive.google.com')) {
    return `https://drive.google.com/file/d/${gdOpenMatch[1]}/preview`;
  }

  // --- Facebook ---
  // https://www.facebook.com/watch/?v=VIDEO_ID
  // https://www.facebook.com/username/videos/VIDEO_ID
  const fbMatch = trimmedUrl.match(/(?:facebook\.com\/.*\/videos\/)([0-9]+)/);
  if (fbMatch) {
    return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${fbMatch[1]}/&show_text=false`;
  }
  
  const fbWatchMatch = trimmedUrl.match(/[?&]v=([0-9]+)/);
  if (fbWatchMatch && trimmedUrl.includes('facebook.com')) {
    return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${fbWatchMatch[1]}/&show_text=false`;
  }

  // --- Dailymotion ---
  // https://www.dailymotion.com/video/VIDEO_ID
  const dmMatch = trimmedUrl.match(/(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/);
  if (dmMatch) {
    return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;
  }

  // --- Twitch (Clip หรือ Video) ---
  // https://clips.twitch.tv/CLIP_ID
  const twitchClipMatch = trimmedUrl.match(/(?:clips\.twitch\.tv\/)([a-zA-Z0-9]+)/);
  if (twitchClipMatch) {
    return `https://clips.twitch.tv/embed?clip=${twitchClipMatch[1]}`;
  }
  
  // https://www.twitch.tv/videos/VIDEO_ID
  const twitchVideoMatch = trimmedUrl.match(/(?:twitch\.tv\/videos\/)([0-9]+)/);
  if (twitchVideoMatch) {
    return `https://player.twitch.tv/?video=${twitchVideoMatch[1]}`;
  }

  // --- ถ้าไม่มีรูปแบบที่รู้จัก ให้คืนค่าเดิม (อาจเป็น URL ตรง ๆ ที่ใช้ได้อยู่แล้ว) ---
  return trimmedUrl;
}