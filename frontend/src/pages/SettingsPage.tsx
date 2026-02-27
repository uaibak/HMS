import { Alert, App, Button, Form, Input, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';

export function SettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getSettings()
      .then((data) => {
        if (!mounted) return;
        if (data) {
          form.setFieldsValue({
            ...data,
            rolesConfig: JSON.stringify(data.rolesConfig, null, 2),
            permissionsConfig: JSON.stringify(data.permissionsConfig, null, 2),
          });
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load settings');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [form]);

  async function submit(values: any) {
    try {
      setSaving(true);
      await saveSettings({
        ...values,
        rolesConfig: JSON.parse(values.rolesConfig),
        permissionsConfig: JSON.parse(values.permissionsConfig),
      });
      message.success('Settings saved');
    } catch {
      message.error('Unable to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title="Settings" subtitle="Configure hospital profile, role policy, and permission metadata." />
      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}
      {!loading && error ? <Alert type="error" showIcon message={error} /> : null}
      <Form layout="vertical" form={form} onFinish={submit}>
        <Form.Item name="hospitalName" label="Hospital Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="hospitalEmail" label="Hospital Email" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="hospitalPhone" label="Hospital Phone" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="hospitalAddress" label="Hospital Address" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="rolesConfig" label="Roles JSON" rules={[{ required: true }]}><Input.TextArea rows={6} /></Form.Item>
        <Form.Item name="permissionsConfig" label="Permissions JSON" rules={[{ required: true }]}><Input.TextArea rows={6} /></Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
      </Form>
    </div>
  );
}
