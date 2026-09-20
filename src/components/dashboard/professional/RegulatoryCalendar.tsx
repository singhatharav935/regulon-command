/**
 * Professional Regulatory Calendar Widget
 * Compliance deadlines and regulatory events tracking
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, AlertTriangle, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isAfter, isBefore } from "date-fns";

interface RegulatoryEvent {
  id: string;
  title: string;
  regulator: string;
  due_date: string;
  type: 'filing' | 'audit' | 'renewal' | 'compliance_check' | 'payment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'upcoming' | 'due_today' | 'overdue' | 'completed';
  company_name?: string;
  description?: string;
  recurring?: boolean;
}

interface RegulatoryCalendarProps {
  events: RegulatoryEvent[];
  onAddEvent?: () => void;
  onEventClick?: (event: RegulatoryEvent) => void;
  className?: string;
}

const RegulatoryCalendar = ({ 
  events, 
  onAddEvent, 
  onEventClick,
  className = "" 
}: RegulatoryCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue'>('all');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.due_date), date));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'due_today': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredEvents = events.filter(event => {
    switch (filter) {
      case 'upcoming': return event.status === 'upcoming';
      case 'overdue': return event.status === 'overdue';
      default: return true;
    }
  }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const eventStats = {
    total: events.length,
    due_today: events.filter(e => e.status === 'due_today').length,
    overdue: events.filter(e => e.status === 'overdue').length,
    this_week: events.filter(e => {
      const eventDate = new Date(e.due_date);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return isAfter(eventDate, new Date()) && isBefore(eventDate, weekFromNow);
    }).length,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <span>Regulatory Calendar</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1 text-sm rounded-l-lg ${
                  view === 'calendar' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 text-sm rounded-r-lg ${
                  view === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
            {onAddEvent && (
              <Button onClick={onAddEvent} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{eventStats.total}</div>
            <div className="text-xs text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{eventStats.due_today}</div>
            <div className="text-xs text-gray-600">Due Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{eventStats.overdue}</div>
            <div className="text-xs text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{eventStats.this_week}</div>
            <div className="text-xs text-gray-600">This Week</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {view === 'calendar' ? (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {monthDays.map(day => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-1 border rounded ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday(day) ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-sm ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday(day) ? 'font-bold text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={`px-1 py-0.5 text-xs rounded cursor-pointer hover:opacity-80 ${
                            getPriorityColor(event.priority)
                          } text-white truncate`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* List View Filters */}
            <div className="flex items-center space-x-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Event List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No events found</p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)}`} />
                        <div>
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600">{event.regulator}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(event.due_date), 'MMM dd, yyyy')}</span>
                        </div>
                        {event.company_name && (
                          <span>{event.company_name}</span>
                        )}
                        {event.recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-xs text-gray-600 mt-2">{event.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegulatoryCalendar;