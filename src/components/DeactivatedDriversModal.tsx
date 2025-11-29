import { X, UserX, UserCheck, Mail, Phone, Clock, Search, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface DeactivatedDriver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  deactivatedAt: string;
  reason?: string;
}

interface DeactivatedDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: DeactivatedDriver[];
  isDarkMode?: boolean;
  onReactivate: (driverId: string) => Promise<void>;
}

export function DeactivatedDriversModal({
  isOpen,
  onClose,
  drivers,
  isDarkMode = true,
  onReactivate,
}: DeactivatedDriversModalProps) {
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmingReactivate, setConfirmingReactivate] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Filter drivers based on search
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm)
  );

  // Format phone number
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReactivate = async (driverId: string, driverName: string) => {
    // Show confirmation
    setConfirmingReactivate(driverId);
  };

  const confirmReactivate = async (driverId: string, driverName: string) => {
    setReactivating(driverId);
    setConfirmingReactivate(null);
    
    try {
      await onReactivate(driverId);
      toast.success(`${driverName} has been reactivated successfully`);
    } catch (error: any) {
      toast.error(`Failed to reactivate driver: ${error.message || "Unknown error"}`);
    } finally {
      setReactivating(null);
    }
  };

  const cancelReactivate = () => {
    setConfirmingReactivate(null);
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 60,
          animation: 'fadeIn 0.2s ease-in-out'
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 1rem',
          overflowY: 'auto'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div
          ref={modalRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '48rem',
            margin: '1.5rem 0',
            animation: 'zoomIn 0.2s ease-in-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card */}
          <Card 
            style={{
              backgroundColor: isDarkMode ? '#3d4a4f' : '#ffffff',
              border: 'none',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '0.5rem'
            }}
          >
            {/* Header - REPLACED CardHeader with div */}
            <div 
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: isDarkMode ? '#3d4a4f' : '#ffffff',
                borderBottom: `1px solid ${isDarkMode ? '#6b7280' : '#e5e7eb'}`,
                padding: '1rem 1.25rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <div 
                    style={{
                      padding: '0.5rem',
                      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fee2e2',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <UserX 
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        color: isDarkMode ? '#f87171' : '#dc2626'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      id="modal-title"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: isDarkMode ? '#ffffff' : '#222B2D',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Deactivated Drivers
                    </h2>
                    <p
                      id="modal-description"
                      style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#e5e7eb' : '#6b7280',
                        marginTop: '0.25rem'
                      }}
                    >
                      {filteredDrivers.length} of {drivers.length} {drivers.length === 1 ? "account" : "accounts"}
                    </p>
                  </div>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDarkMode ? '#e5e7eb' : '#4b5563',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(243, 244, 246, 1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Close modal"
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              {/* Search Bar - REPLACED Input with input */}
              {drivers.length > 0 && (
                <div style={{ marginTop: '1rem', position: 'relative' }}>
                  <Search 
                    style={{
                      position: 'absolute',
                      left: '0.625rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1rem',
                      height: '1rem',
                      color: isDarkMode ? '#e5e7eb' : '#9ca3af',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      paddingLeft: '2.25rem',
                      height: '2.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: isDarkMode ? '#4b5563' : '#ffffff',
                      borderColor: isDarkMode ? '#6b7280' : '#e5e7eb',
                      color: isDarkMode ? '#ffffff' : '#111827',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '0.375rem',
                      width: '100%',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#27AE60';
                      e.target.style.boxShadow = '0 0 0 2px rgba(39, 174, 96, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDarkMode ? '#6b7280' : '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                    aria-label="Search drivers"
                  />
                </div>
              )}
            </div>

            {/* Body */}
            <CardContent 
              className="custom-scrollbar"
              style={{
                flex: 1,
                padding: '1.25rem',
                overflowY: 'auto',
                backgroundColor: isDarkMode ? '#3d4a4f' : '#ffffff',
                maxHeight: 'calc(85vh - 180px)'
              }}
            >
              {drivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <UserX 
                    style={{
                      width: '3rem',
                      height: '3rem',
                      color: isDarkMode ? '#9ca3af' : '#d1d5db',
                      margin: '0 auto 0.75rem'
                    }}
                  />
                  <p 
                    style={{
                      fontSize: '0.875rem',
                      color: isDarkMode ? '#d1d5db' : '#6b7280'
                    }}
                  >
                    No deactivated drivers found
                  </p>
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <Search 
                    style={{
                      width: '3rem',
                      height: '3rem',
                      color: isDarkMode ? '#9ca3af' : '#d1d5db',
                      margin: '0 auto 0.75rem'
                    }}
                  />
                  <p 
                    style={{
                      fontSize: '0.875rem',
                      color: isDarkMode ? '#d1d5db' : '#6b7280'
                    }}
                  >
                    No drivers match your search
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredDrivers.map((driver, index) => (
                    <Card
                      key={driver.id}
                      style={{
                        backgroundColor: isDarkMode ? '#4b5563' : '#ffffff',
                        borderColor: isDarkMode ? '#6b7280' : '#e5e7eb',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s',
                        animationDelay: `${index * 50}ms`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <CardContent style={{ padding: '1rem' }}>
                        {/* Header Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <h3 
                            style={{
                              fontWeight: 500,
                              fontSize: '0.875rem',
                              color: isDarkMode ? '#ffffff' : '#222B2D',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            {driver.name}
                          </h3>
                          <Badge
                            variant="outline"
                            style={{
                              fontSize: '0.75rem',
                              backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fef2f2',
                              color: isDarkMode ? '#f87171' : '#b91c1c',
                              borderColor: isDarkMode ? '#991b1b' : '#fecaca',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.375rem',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                          >
                            Deactivated
                          </Badge>
                        </div>

                        {/* Info Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'help' }}>
                                  <Mail 
                                    style={{
                                      width: '1rem',
                                      height: '1rem',
                                      color: isDarkMode ? '#e5e7eb' : '#6b7280',
                                      flexShrink: 0
                                    }}
                                  />
                                  <span 
                                    style={{
                                      color: isDarkMode ? '#f3f4f6' : '#374151',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {driver.email}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{driver.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {driver.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Phone 
                                style={{
                                  width: '1rem',
                                  height: '1rem',
                                  color: isDarkMode ? '#e5e7eb' : '#6b7280',
                                  flexShrink: 0
                                }}
                              />
                              <span style={{ color: isDarkMode ? '#f3f4f6' : '#374151' }}>
                                {formatPhone(driver.phone)}
                              </span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <Clock 
                              style={{
                                width: '1rem',
                                height: '1rem',
                                color: isDarkMode ? '#e5e7eb' : '#6b7280',
                                flexShrink: 0
                              }}
                            />
                            <span style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280' }}>
                              {new Date(driver.deactivatedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Reason */}
                        {driver.reason && (
                          <div 
                            style={{
                              marginBottom: '0.75rem',
                              padding: '0.625rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                              color: isDarkMode ? '#f3f4f6' : '#4b5563',
                              borderColor: isDarkMode ? '#6b7280' : '#e5e7eb',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>Reason:</span> {driver.reason}
                          </div>
                        )}

                        {/* Action Buttons */}
                        {confirmingReactivate === driver.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div 
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                padding: '0.625rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
                                borderColor: isDarkMode ? '#ca8a04' : '#fde047',
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                            >
                              <AlertCircle 
                                style={{
                                  width: '1rem',
                                  height: '1rem',
                                  color: isDarkMode ? '#fbbf24' : '#ca8a04',
                                  flexShrink: 0,
                                  marginTop: '0.125rem'
                                }}
                              />
                              <p style={{ color: isDarkMode ? '#fef3c7' : '#92400e' }}>
                                Are you sure you want to reactivate <strong>{driver.name}</strong>?
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button
                                onClick={() => confirmReactivate(driver.id, driver.name)}
                                disabled={reactivating === driver.id}
                                style={{
                                  flex: 1,
                                  height: '2.5rem',
                                  fontSize: '0.875rem',
                                  backgroundColor: '#27AE60',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.375rem',
                                  opacity: reactivating === driver.id ? 0.5 : 1,
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!reactivating) e.currentTarget.style.backgroundColor = '#229954';
                                }}
                                onMouseLeave={(e) => {
                                  if (!reactivating) e.currentTarget.style.backgroundColor = '#27AE60';
                                }}
                                size="sm"
                              >
                                <UserCheck style={{ width: '1rem', height: '1rem' }} />
                                Confirm
                              </Button>
                              <button
                                onClick={cancelReactivate}
                                style={{
                                  flex: 1,
                                  height: '2.5rem',
                                  fontSize: '0.875rem',
                                  backgroundColor: isDarkMode ? '#4b5563' : '#ffffff',
                                  borderColor: isDarkMode ? '#6b7280' : '#d1d5db',
                                  color: isDarkMode ? '#f3f4f6' : '#374151',
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(75, 85, 99, 0.8)' : 'rgba(243, 244, 246, 1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#ffffff';
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleReactivate(driver.id, driver.name)}
                            disabled={reactivating === driver.id}
                            style={{
                              width: '100%',
                              height: '2.5rem',
                              fontSize: '0.875rem',
                              backgroundColor: '#27AE60',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                              opacity: reactivating === driver.id ? 0.5 : 1,
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!reactivating) e.currentTarget.style.backgroundColor = '#229954';
                            }}
                            onMouseLeave={(e) => {
                              if (!reactivating) e.currentTarget.style.backgroundColor = '#27AE60';
                            }}
                            size="sm"
                          >
                            {reactivating === driver.id ? (
                              <>
                                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                                Reactivating...
                              </>
                            ) : (
                              <>
                                <UserCheck style={{ width: '1rem', height: '1rem' }} />
                                Reactivate Driver
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${isDarkMode ? 'rgba(107, 114, 128, 0.7)' : 'rgba(156, 163, 175, 0.5)'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: ${isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(107, 114, 128, 0.7)'};
        }
      `}</style>
    </>
  );
}