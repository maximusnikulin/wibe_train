import { useState, useRef, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface UserMultiselectProps {
  users: User[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function UserMultiselect({ users, selectedIds, onChange }: UserMultiselectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedUsers = users.filter(user => selectedIds.includes(user.id));

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const removeUser = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== userId));
  };

  return (
    <div className="user-multiselect" ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Selected Users View (Default View if items selected) */}
      <div
        onClick={() => {
          if (!isOpen) setIsOpen(true);
        }}
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '0.5rem',
          minHeight: '38px',
          cursor: 'text',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        {selectedUsers.map(user => (
          <span
            key={user.id}
            style={{
              backgroundColor: '#e9ecef',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {user.firstName} {user.lastName}
            <button
              type="button"
              onClick={(e) => removeUser(user.id, e)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '1rem',
                lineHeight: 1,
                color: '#666'
              }}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={selectedUsers.length === 0 ? "Поиск участников..." : "Добавить..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            minWidth: '100px',
            padding: '0.25rem'
          }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginTop: '4px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {selectedIds.length === 0 && searchTerm.length < 3 ? (
            <div style={{ padding: '0.5rem', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
              Введите минимум 3 символа для поиска
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <label
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: selectedIds.includes(user.id) ? '#f8f9fa' : 'transparent'
                }}
              >
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                  />
                </div>
                <span>
                  {user.firstName} {user.lastName} <span style={{ color: '#888', fontSize: '0.875rem' }}>({user.email})</span>
                </span>
              </label>
            ))
          ) : (
            <div style={{ padding: '0.5rem', textAlign: 'center', color: '#666' }}>
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </div>
  );
}
