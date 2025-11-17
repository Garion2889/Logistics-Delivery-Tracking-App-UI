-- Create storage bucket for POD images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pod-images', 'pod-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pod-images bucket
CREATE POLICY "Admins can upload POD images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pod-images' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can upload POD images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pod-images' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver'
    )
  );

CREATE POLICY "Admins can view all POD images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pod-images' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can view POD images for their deliveries"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pod-images' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver'
    )
  );

CREATE POLICY "Admins can delete POD images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pod-images' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
