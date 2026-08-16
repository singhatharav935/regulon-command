/**
 * Professional Notification Center
 * Real-time alerts and system notifications
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Info,
  Calendar,
  FileText,
  Users,
  Settings,
  X,
  Eye,
  Archive
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success' | 'deadline' | 'task' | 'document';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: {
    company?: string;
    regulator?: string;
    task_id?: string;
    document_id?: string;
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
  onAction?: (notification: Notification) => void;
  className?: string;
}

const NotificationCenter = ({ 
  notifications, 
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onAction,
  className = "" 
}: NotificationCenterProps) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deadline': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'task': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'document': return <FileText className="w-4 h-4 text-gray-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string, urgent: boolean = false) => {
    if (urgent) return 'border-l-red-500 bg-red-50';
    
    switch (type) {
      case 'alert': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'deadline': return 'border-l-orange-500 bg-orange-50';
      case 'task': return 'border-l-purple-500 bg-purple-50';
      case 'document': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'urgent': return notification.urgent;
      default: return true;
    }
  });

  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    urgent: notifications.filter(n => n.urgent).length,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
            {notificationStats.unread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {notificationStats.unread}
              </Badge>
            )}
          </CardTitle>
          {onMarkAllAsRead && notificationStats.unread > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Notification Stats */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>{notificationStats.total} total</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{notificationStats.unread} unread</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>{notificationStats.urgent} urgent</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {['all', 'unread', 'urgent'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filter === filterOption
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`border-l-4 p-3 rounded-r-lg ${getTypeColor(notification.type, notification.urgent)} ${
                  notification.read ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-3 flex-1">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        {notification.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {!notification.read && onMarkAsRead && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                    {onDismiss && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDismiss(notification.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {notification.metadata && (
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        {notification.metadata.company && (
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{notification.metadata.company}</span>
                          </span>
                        )}
                        {notification.metadata.regulator && (
                          <span>{notification.metadata.regulator}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>

                  {notification.action_url && onAction && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAction(notification)}
                    >
                      {notification.action_label || 'View'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;