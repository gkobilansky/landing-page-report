import { POST } from '../route';

describe('/api/analyze', () => {
  const createRequest = (body: any) => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue(body),
      method: 'POST',
      headers: new Map([['Content-Type', 'application/json']]),
    };
    return mockRequest as any;
  };

  it('should return 400 if URL is missing', async () => {
    const request = createRequest({ email: 'test@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL and email are required');
  });

  it('should return 400 if email is missing', async () => {
    const request = createRequest({ url: 'https://example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL and email are required');
  });

  it('should return 400 for invalid URL format', async () => {
    const request = createRequest({ 
      url: 'invalid-url', 
      email: 'test@example.com' 
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid URL format');
  });

  it('should return 400 for invalid email format', async () => {
    const request = createRequest({ 
      url: 'https://example.com', 
      email: 'invalid-email' 
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email format');
  });

  it('should return 200 for valid URL and email', async () => {
    const request = createRequest({ 
      url: 'https://example.com', 
      email: 'test@example.com' 
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.analysisId).toBe('test-id');
    expect(data.message).toContain('Analysis started');
  });

  it('should accept URLs with different protocols', async () => {
    const httpRequest = createRequest({ 
      url: 'http://example.com', 
      email: 'test@example.com' 
    });
    const httpResponse = await POST(httpRequest);
    expect(httpResponse.status).toBe(200);

    const httpsRequest = createRequest({ 
      url: 'https://example.com', 
      email: 'test@example.com' 
    });
    const httpsResponse = await POST(httpsRequest);
    expect(httpsResponse.status).toBe(200);
  });

  it('should reject URLs with invalid protocols', async () => {
    const request = createRequest({ 
      url: 'ftp://example.com', 
      email: 'test@example.com' 
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid URL format');
  });
});