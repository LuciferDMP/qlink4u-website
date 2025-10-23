-- Insert sample links for testing
INSERT INTO links_2025_10_23_12_04 (alias, destination_url, link_type, title, description, is_active) VALUES
('demo', 'https://www.google.com', 'redirect', 'Demo Link', 'Link demo để test chức năng redirect', true),
('masking-demo', 'https://www.wikipedia.org', 'masking', 'Masking Demo', 'Link demo để test chức năng masking', true),
('github', 'https://github.com', 'redirect', 'GitHub', 'Trang chủ GitHub', true),
('youtube', 'https://www.youtube.com', 'masking', 'YouTube', 'YouTube với masking', true);