import React from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  CheckCircle, 
  XCircle, 
  Eye,
  MousePointer,
  TrendingUp,
  Activity
} from 'lucide-react';

interface CommunicationMetrics {
  sms: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  email: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  whatsapp: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  topTemplates: Array<{
    template: string;
    count: number;
  }>;
}

interface CommunicationMetricsProps {
  data: CommunicationMetrics;
}

export function CommunicationMetrics({ data }: CommunicationMetricsProps) {
  const calculateSuccessRate = (sent: number, failed: number) => {
    const total = sent + failed;
    return total > 0 ? ((sent / total) * 100).toFixed(1) : '0.0';
  };

  const calculateDeliveryRate = (delivered: number, sent: number) => {
    return sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0.0';
  };

  const calculateOpenRate = (opened: number, delivered: number) => {
    return delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0.0';
  };

  const calculateClickRate = (clicked: number, opened: number) => {
    return opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="space-y-6">
      {/* Communication Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SMS Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Phone className="w-5 h-5 text-blue-500 mr-2" />
              SMS Messages
            </h3>
            <div className="text-2xl font-bold text-blue-600">{data.sms.total}</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Send className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Sent</span>
              </div>
              <span className="text-sm font-medium">{data.sms.sent}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Delivered</span>
              </div>
              <span className="text-sm font-medium">{data.sms.delivered}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="text-sm font-medium">{data.sms.failed}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {calculateSuccessRate(data.sms.sent, data.sms.failed)}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Delivery Rate</span>
                <span className="text-sm font-medium text-blue-600">
                  {calculateDeliveryRate(data.sms.delivered, data.sms.sent)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Mail className="w-5 h-5 text-purple-500 mr-2" />
              Email Messages
            </h3>
            <div className="text-2xl font-bold text-purple-600">{data.email.total}</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Send className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Sent</span>
              </div>
              <span className="text-sm font-medium">{data.email.sent}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Delivered</span>
              </div>
              <span className="text-sm font-medium">{data.email.delivered}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Eye className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Opened</span>
              </div>
              <span className="text-sm font-medium">{data.email.opened}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <MousePointer className="w-4 h-4 text-indigo-500 mr-2" />
                <span className="text-sm text-gray-600">Clicked</span>
              </div>
              <span className="text-sm font-medium">{data.email.clicked}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="text-sm font-medium">{data.email.failed}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className="text-sm font-medium text-blue-600">
                  {calculateOpenRate(data.email.opened, data.email.delivered)}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className="text-sm font-medium text-indigo-600">
                  {calculateClickRate(data.email.clicked, data.email.opened)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 text-green-500 mr-2" />
              WhatsApp Messages
            </h3>
            <div className="text-2xl font-bold text-green-600">{data.whatsapp.total}</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Send className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Sent</span>
              </div>
              <span className="text-sm font-medium">{data.whatsapp.sent}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Delivered</span>
              </div>
              <span className="text-sm font-medium">{data.whatsapp.delivered}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="text-sm font-medium">{data.whatsapp.failed}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {calculateSuccessRate(data.whatsapp.sent, data.whatsapp.failed)}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Delivery Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {calculateDeliveryRate(data.whatsapp.delivered, data.whatsapp.sent)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Message Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 text-primary-500 mr-2" />
          Top Message Templates
        </h3>
        
        {data.topTemplates.length > 0 ? (
          <div className="space-y-3">
            {data.topTemplates.map((template, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {template.template.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 mr-2">{template.count}</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No message templates data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunicationMetrics;
