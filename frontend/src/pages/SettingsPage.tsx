import { Button, Form, Input, Typography, message } from 'antd';
import { useEffect } from 'react';
import { getSettings, saveSettings } from '../services/api';

export function SettingsPage() {
  const [form] = Form.useForm();

  useEffect(() => {
    getSettings().then((data) => {
      if (data) {
        form.setFieldsValue({
          ...data,
          rolesConfig: JSON.stringify(data.rolesConfig, null, 2),
          permissionsConfig: JSON.stringify(data.permissionsConfig, null, 2),
        });
      }
    });
  }, [form]);

  async function submit(values: any) {
    await saveSettings({
      ...values,
      rolesConfig: JSON.parse(values.rolesConfig),
      permissionsConfig: JSON.parse(values.permissionsConfig),
    });
    message.success('Settings saved');
  }

  return (
    <div>
      <Typography.Title level={3}>Settings</Typography.Title>
      <Form layout="vertical" form={form} onFinish={submit}>
        <Form.Item name="hospitalName" label="Hospital Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="hospitalEmail" label="Hospital Email" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="hospitalPhone" label="Hospital Phone" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="hospitalAddress" label="Hospital Address" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="rolesConfig" label="Roles JSON" rules={[{ required: true }]}><Input.TextArea rows={6} /></Form.Item>
        <Form.Item name="permissionsConfig" label="Permissions JSON" rules={[{ required: true }]}><Input.TextArea rows={6} /></Form.Item>
        <Button type="primary" htmlType="submit">Save</Button>
      </Form>
    </div>
  );
}
