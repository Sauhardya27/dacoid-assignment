"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Search, Trash2, Sun, Moon, Plus } from 'lucide-react';

interface Event {
	id: number;
	title: string;
	startTime: string;
	endTime: string;
	description: string;
	color: string;
}

interface EventsState {
	[key: string]: Event[];
}

const Calendar: React.FC = () => {
	const [darkMode, setDarkMode] = useState(false);
	const [currentDate, setCurrentDate] = useState<Date>(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [events, setEvents] = useState<EventsState>({});
	const [showEventModal, setShowEventModal] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [eventForm, setEventForm] = useState<Omit<Event, 'id'>>({
		title: '',
		startTime: '',
		endTime: '',
		description: '',
		color: '#3b82f6'
	});

	useEffect(() => {
		const savedDarkMode = localStorage.getItem('calendarDarkMode');
		if (savedDarkMode) {
			setDarkMode(JSON.parse(savedDarkMode));
		}
	}, []);

	useEffect(() => {
		localStorage.setItem('calendarDarkMode', JSON.stringify(darkMode));
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [darkMode]);

	useEffect(() => {
		try {
			const savedEvents = localStorage.getItem('calendarEvents');
			if (savedEvents) {
				setEvents(JSON.parse(savedEvents));
			}
		} catch (error) {
			console.error('Error loading events:', error);
		}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem('calendarEvents', JSON.stringify(events));
		} catch (error) {
			console.error('Error saving events:', error);
		}
	}, [events]);

	const getDaysInMonth = (date: Date): number => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date): number => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const previousMonth = (): void => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
	};

	const nextMonth = (): void => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
	};

	const handleDateClick = (day: number, event?: Event): void => {
		const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
		setSelectedDate(selectedDate);
		setShowEventModal(true);

		if (event) {
			setSelectedEvent(event);
			setEventForm({
				title: event.title,
				startTime: event.startTime,
				endTime: event.endTime,
				description: event.description,
				color: event.color
			});
		} else {
			setSelectedEvent(null);
			setEventForm({
				title: '',
				startTime: '',
				endTime: '',
				description: '',
				color: '#3b82f6'
			});
		}
	};

	const checkTimeConflict = (startTime: string, endTime: string, events: Event[], currentEventId?: number): boolean => {
		const start = new Date(`1970-01-01T${startTime}`);
		const end = new Date(`1970-01-01T${endTime}`);

		return events.some(event => {
			if (currentEventId === event.id) return false;

			const eventStart = new Date(`1970-01-01T${event.startTime}`);
			const eventEnd = new Date(`1970-01-01T${event.endTime}`);

			return (
				(start >= eventStart && start < eventEnd) ||
				(end > eventStart && end <= eventEnd) ||
				(start <= eventStart && end >= eventEnd)
			);
		});
	};

	const handleEventSubmit = (): void => {
		if (!selectedDate || !eventForm.title || !eventForm.startTime || !eventForm.endTime) {
			alert('Please fill in all required fields');
			return;
		}

		if (new Date(`1970-01-01T${eventForm.startTime}`) >= new Date(`1970-01-01T${eventForm.endTime}`)) {
			alert('End time must be after start time');
			return;
		}

		const dateKey = selectedDate.toISOString().split('T')[0];
		const dayEvents = events[dateKey] || [];

		const hasConflict = checkTimeConflict(
			eventForm.startTime,
			eventForm.endTime,
			dayEvents,
			selectedEvent?.id
		);

		if (hasConflict) {
			alert('Event time conflicts with an existing event!');
			return;
		}

		const newEvent: Event = {
			...eventForm,
			id: selectedEvent?.id || Date.now()
		};

		setEvents(prev => ({
			...prev,
			[dateKey]: selectedEvent
				? [...(prev[dateKey] || []).filter(e => e.id !== selectedEvent.id), newEvent]
				: [...(prev[dateKey] || []), newEvent]
		}));

		setShowEventModal(false);
	};

	const handleEventDelete = (event: Event): void => {
		if (!selectedDate) return;
		const dateKey = selectedDate.toISOString().split('T')[0];

		if (window.confirm('Are you sure you want to delete this event?')) {
			setEvents(prev => ({
				...prev,
				[dateKey]: (prev[dateKey] || []).filter(e => e.id !== event.id)
			}));
			setShowEventModal(false);
		}
	};

	const getFilteredEvents = (dateKey: string): Event[] => {
		const dayEvents = events[dateKey] || [];
		if (!searchTerm) return dayEvents;

		return dayEvents.filter(event =>
			event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			event.description.toLowerCase().includes(searchTerm.toLowerCase())
		);
	};

	const exportEvents = (): void => {
		try {
			const dataStr = JSON.stringify(events, null, 2);
			const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
			const exportFileDefaultName = `calendar-events-${currentDate.toISOString().split('T')[0]}.json`;

			const linkElement = document.createElement('a');
			linkElement.setAttribute('href', dataUri);
			linkElement.setAttribute('download', exportFileDefaultName);
			linkElement.click();
		} catch (error) {
			console.error('Error exporting events:', error);
			alert('Failed to export events. Please try again.');
		}
	};

	const renderCalendarGrid = () => {
		const daysInMonth = getDaysInMonth(currentDate);
		const firstDay = getFirstDayOfMonth(currentDate);
		const days = [];

		for (let i = 0; i < firstDay; i++) {
			days.push(
				<div
					key={`empty-${i}`}
					className={`h-32 border transition-colors ${darkMode
						? 'bg-gray-800/50 border-gray-700/50'
						: 'bg-gray-100/50 border-gray-200/50'
						}`}
				/>
			);
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
			const dateKey = date.toISOString().split('T')[0];
			const dayEvents = getFilteredEvents(dateKey);
			const isToday = new Date().toDateString() === date.toDateString();
			const isWeekend = date.getDay() === 0 || date.getDay() === 6;

			days.push(
				<div
					key={day}
					className={`h-32 border p-2 cursor-pointer transition-all group
				${darkMode
							? 'border-gray-700 hover:bg-gray-700/50'
							: 'border-gray-200 hover:bg-blue-50/50'}
				${isToday
							? darkMode
								? 'bg-blue-900/20 border-blue-500/30'
								: 'bg-blue-50 border-blue-200'
							: ''}
				${isWeekend && !isToday
							? darkMode
								? 'bg-gray-800/30'
								: 'bg-gray-50'
							: darkMode
								? 'bg-gray-800'
								: 'bg-white'}`}
					onClick={(e) => {
						if (!(e.target as HTMLElement).closest('.event-item')) {
							handleDateClick(day);
						}
					}}
				>
					<div className="flex justify-between items-center mb-1">
						<span className={`font-medium px-2 py-1 rounded-full ${isToday
							? darkMode
								? 'bg-blue-500 text-white'
								: 'bg-blue-500 text-white'
							: darkMode
								? 'text-gray-100'
								: 'text-gray-700'
							}`}>
							{day}
						</span>
						{dayEvents.length > 0 && (
							<span className={`text-xs px-2 py-1 rounded-full ${darkMode
								? 'bg-blue-900/30 text-blue-200'
								: 'bg-blue-100 text-blue-700'
								}`}>
								{dayEvents.length}
							</span>
						)}
					</div>
					<div className="mt-1 space-y-1.5">
						{dayEvents.slice(0, 3).map(event => (
							<div
								key={event.id}
								className="event-item text-xs p-2 rounded-md truncate hover:opacity-75 transition-all"
								style={{
									backgroundColor: `${event.color}${darkMode ? '30' : '15'}`,
									color: darkMode
										? `${event.color}EE`
										: event.color
								}}
								onClick={(e) => {
									e.stopPropagation();
									handleDateClick(day, event);
								}}
							>
								<div className="flex items-center gap-1.5">
									<div
										className="w-2 h-2 rounded-full flex-shrink-0"
										style={{ backgroundColor: event.color }}
									/>
									<span className="font-medium">{event.title}</span>
								</div>
							</div>
						))}
						{dayEvents.length > 3 && (
							<div className={`text-xs font-medium px-2 py-1 rounded-md ${darkMode
								? 'bg-gray-700/50 text-gray-300'
								: 'bg-gray-100 text-gray-600'
								}`}>
								+{dayEvents.length - 3} more
							</div>
						)}
					</div>
				</div>
			);
		}
		return days;
	};

	return (
		<div className={`min-h-screen p-8 transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
			}`}>
			<div className={`max-w-7xl mx-auto p-8 rounded-xl shadow-2xl transition-colors ${darkMode
				? 'bg-gray-800/50 shadow-gray-900/50'
				: 'bg-white/80 shadow-gray-200/50 backdrop-blur-sm'
				}`}>

				<div className="mb-8 space-y-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="flex items-center gap-6">
							<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
								{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
							</h1>
							<div className={`flex items-center p-1 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
								<Button
									variant="ghost"
									size="icon"
									onClick={previousMonth}
									className={`hover:shadow-sm transition-all ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
										}`}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<div
									className={`w-[2px] h-10 mx-2 ${darkMode ? 'bg-gray-500' : 'bg-white'
										}`}
								></div>
								<Button
									variant="ghost"
									size="icon"
									onClick={nextMonth}
									className={`hover:shadow-sm transition-all ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
										}`}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>


						</div>

						<div className="flex items-center gap-4 w-full sm:w-auto">
							<div className="relative flex-1 sm:flex-none">
								<Search className={`h-4 w-4 absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
								<Input
									placeholder="Search events..."
									className={`pl-10 w-full sm:w-64 focus-visible:ring-2 ring-blue-500 transition-colors
                    ${darkMode
											? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
											: 'bg-gray-50 border-0'}`}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>

							<Button
								onClick={() => setDarkMode(!darkMode)}
								variant="outline"
								size="icon"
								className={`transition-colors
                  ${darkMode
										? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
										: 'bg-white hover:bg-gray-50'}`}
							>
								{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
							</Button>

							<Button
								onClick={() => {
									setSelectedDate(new Date());
									setShowEventModal(true);
									setSelectedEvent(null);
									setEventForm({
										title: '',
										startTime: '',
										endTime: '',
										description: '',
										color: '#3b82f6'
									});
								}}
								className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 transition-opacity gap-2"
							>
								<Plus className="h-4 w-4" />
								New Event
							</Button>

							<Button
								onClick={exportEvents}
								variant="outline"
								className={`transition-colors ${darkMode
									? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
									: 'bg-white hover:bg-gray-50'}`}
							>
								Export Events
							</Button>
						</div>
					</div>
				</div>

				<div className={`rounded-xl overflow-hidden border shadow-sm transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'
					}`}>
					<div className={`grid grid-cols-7 ${darkMode
						? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30'
						: 'bg-gradient-to-r from-blue-100/50 to-purple-100/50'
						}`}>
						{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
							<div
								key={day}
								className={`text-center py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'
									}`}
							>
								{day}
							</div>
						))}
					</div>

					<div className={`grid grid-cols-7 gap-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'
						}`}>
						{renderCalendarGrid()}
					</div>
				</div>

				<Dialog open={showEventModal} onOpenChange={setShowEventModal}>
					<DialogContent className={`sm:max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
						<DialogHeader>
							<DialogTitle className="text-xl font-bold flex items-center gap-2">
								<div className="h-2 w-2 rounded-full" style={{ backgroundColor: eventForm.color }}></div>
								{selectedEvent ? 'Edit Event' : 'New Event'}
								{selectedDate && (
									<span className={`text-sm ml-2 font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										{selectedDate.toLocaleDateString()}
									</span>
								)}
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-6 mt-6">
							<div className="space-y-2">
								<Label htmlFor="title" className={`text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>
									Event Title
								</Label>
								<Input
									id="title"
									value={eventForm.title}
									onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
									className={`focus-visible:ring-2 ring-blue-500 ${darkMode
										? 'bg-gray-700 border-gray-600 text-white'
										: ''}`}
									placeholder="Enter event title"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="startTime" className={`text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>
										Start Time
									</Label>
									<Input
										id="startTime"
										type="time"
										value={eventForm.startTime}
										onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
										className={`focus-visible:ring-2 ring-blue-500 ${darkMode
											? 'bg-gray-700 border-gray-600 text-white'
											: ''}`}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="endTime" className={`text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>
										End Time
									</Label>
									<Input
										id="endTime"
										type="time"
										value={eventForm.endTime}
										onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
										className={`focus-visible:ring-2 ring-blue-500 ${darkMode
											? 'bg-gray-700 border-gray-600 text-white'
											: ''}`}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description" className={`text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>
									Description (Optional)
								</Label>
								<Input
									id="description"
									value={eventForm.description}
									onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
									className={`focus-visible:ring-2 ring-blue-500 ${darkMode
										? 'bg-gray-700 border-gray-600 text-white'
										: ''}`}
									placeholder="Add event description"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="color" className={`text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>
									Event Color
								</Label>
								<div className="flex gap-4">
									{['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1'].map(color => (
										<div
											key={color}
											onClick={() => setEventForm(prev => ({ ...prev, color }))}
											className={`w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 ${eventForm.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
												}`}
											style={{ backgroundColor: color }}
										/>
									))}
									<Input
										id="color"
										type="color"
										value={eventForm.color}
										onChange={(e) => setEventForm(prev => ({ ...prev, color: e.target.value }))}
										className="w-8 h-8 p-1 cursor-pointer"
									/>
								</div>
							</div>
							<div className="flex justify-end gap-3 mt-6">
								<Button
									variant="outline"
									onClick={() => setShowEventModal(false)}
									className={`${darkMode
										? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
										: 'hover:bg-gray-50'}`}
								>
									Cancel
								</Button>
								{selectedEvent && (
									<Button
										variant="destructive"
										onClick={() => handleEventDelete(selectedEvent)}
										className="gap-2"
									>
										<Trash2 className="h-4 w-4" />
										Delete
									</Button>
								)}
								<Button
									onClick={handleEventSubmit}
									className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
								>
									{selectedEvent ? 'Update' : 'Create'} Event
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
};

export default Calendar;