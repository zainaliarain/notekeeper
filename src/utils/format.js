export const detectBlocks = (text) => {
  const lines = text.split('\n');
  const blocks = [];
  let current = { type: 'text', content: '' };

  const pushCurrent = () => {
    if (current.content.trim()) blocks.push({ ...current });
    current = { type: 'text', content: '' };
  };

  for (let line of lines) {
    const trimmed = line.trim();
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|USE|GRANT|REVOKE)\b/i.test(trimmed)) {
      pushCurrent();
      current = { type: 'sql', content: line };
      pushCurrent();
    } else if (/^(cd|ls|cat|cp|mv|chmod|chown|mount|umount|nano|vi|sudo|systemctl|service|curl|wget|ping|ifconfig|ip|rm|mkdir|touch|df|du|find|grep|tar|zip|unzip|ssh|scp|rsync)\b/.test(trimmed)) {
      pushCurrent();
      current = { type: 'command', content: line };
      pushCurrent();
    } else if (/^step[:\-]/i.test(trimmed)) {
      pushCurrent();
      current = { type: 'step', content: line };
      pushCurrent();
    } else {
      if (current.type !== 'text') pushCurrent();
      current.type = 'text';
      current.content += line + '\n';
    }
  }
  pushCurrent();
  return blocks;
};

export const highlightSearchTerm = (text, term) => {
  if (!term) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};