export const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const hashPasswordWithSalt = async (password: string, salt: string): Promise<string> => {
  const combined = password + '+' + salt;
  return await sha256(combined);
};

export const generateSalt = (): string => {
  return Math.floor(Math.random() * 90000000 + 10000000).toString();
};