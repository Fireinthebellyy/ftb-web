-- Migration to update tags table
DELETE FROM tags;

INSERT INTO tags (name) VALUES 
('Business, Management & Consulting(Consulting/Management/Product/Strategy/Operations)'),
('Creative & Content(Marketing/Design/UI UX/Literature/Film & Media/Content)'),
('Tech & Data(AI/ML/Analytics/Tech/Data Science)'),
('Impact & Change(Social Impact/Dev Comm)'),
('Law & Policy(Law, Governance, Policy, Think Tanks)'),
('Startup & Finance(Entrepreneurship, VC, Finance)'),
('People & Mind(HR, Psychology, Research)');
