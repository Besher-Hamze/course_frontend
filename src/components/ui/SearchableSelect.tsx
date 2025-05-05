'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Search } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SearchableSelectProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    error?: string;
    options: SelectOption[];
    placeholder?: string;
    onChange?: (value: string) => void;
    value?: string;
}

const SearchableSelect = React.forwardRef<HTMLSelectElement, SearchableSelectProps>(
    ({ className, error, options, placeholder = "Select...", onChange, value, ...props }, ref) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const [searchTerm, setSearchTerm] = React.useState('');
        const containerRef = React.useRef<HTMLDivElement>(null);
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Filter options based on search term
        const filteredOptions = React.useMemo(() => {
            return options.filter(option =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }, [options, searchTerm]);

        // Close dropdown when clicking outside
        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

        // Handle key navigation
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };

        // Get the label for the selected value
        const selectedOption = options.find(option => option.value === value);
        const selectedLabel = selectedOption?.label || '';

        const handleOptionClick = (option: SelectOption) => {
            onChange?.(option.value);
            setIsOpen(false);
            setSearchTerm('');
        };

        return (
            <div className="relative" ref={containerRef}>
                {/* Hidden select for form data */}
                <select
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="sr-only"
                    {...props}
                >
                    <option value="">Select...</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Custom select UI */}
                <div
                    className={cn(
                        'relative w-full rounded-md border border-gray-300 bg-white shadow-sm',
                        error && 'border-red-500',
                        className
                    )}
                >
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            className={cn(
                                'flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm focus:outline-none',
                                'disabled:cursor-not-allowed disabled:opacity-50'
                            )}
                            placeholder={isOpen ? "Type to search..." : (selectedLabel || placeholder)}
                            value={isOpen ? searchTerm : selectedLabel}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            onKeyDown={handleKeyDown}
                            readOnly={!isOpen}
                            disabled={props.disabled}
                        />
                        <div className="absolute right-3 pointer-events-none">
                            {isOpen ? (
                                <Search className="h-4 w-4 text-gray-400" />
                            ) : (
                                <svg
                                    className={cn(
                                        'h-4 w-4 text-gray-400 transition-transform',
                                        isOpen && 'rotate-180'
                                    )}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Dropdown options */}
                    {isOpen && (
                        <div className="absolute z-10 w-full mt-1 rounded-md border border-gray-300 bg-white shadow-lg max-h-60 overflow-auto">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            'px-3 py-2 text-sm cursor-pointer hover:bg-gray-100',
                                            option.value === value && 'bg-blue-50 text-blue-600'
                                        )}
                                        onClick={() => handleOptionClick(option)}
                                    >
                                        {option.label}
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                    No results found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }
);
SearchableSelect.displayName = 'SearchableSelect';

export { SearchableSelect };