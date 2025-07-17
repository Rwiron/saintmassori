import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Target,
  DollarSign,
  BookOpen,
  Car,
  Utensils,
  Settings,
  GraduationCap,
  Check,
  X,
  Plus
} from 'lucide-react';
import tariffService from '@/services/tariffService';
import toast from '@/utils/toast';

const AssignTariffModal = ({ 
  isOpen, 
  onClose, 
  classId, 
  className,
  onAssignComplete
}) => {
  const [availableTariffs, setAvailableTariffs] = useState([]);
  const [filteredTariffs, setFilteredTariffs] = useState([]);
  const [displayedTariffs, setDisplayedTariffs] = useState([]);
  const [selectedTariffs, setSelectedTariffs] = useState([]);
  const [assignedTariffIds, setAssignedTariffIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const ITEMS_PER_PAGE = 12; // 3 rows × 4 cards = 12 cards per load

  useEffect(() => {
    if (isOpen && classId) {
      loadAvailableTariffs();
    }
  }, [isOpen, classId]);

  useEffect(() => {
    // Filter tariffs based on search term
    const filtered = availableTariffs.filter(tariff => 
      tariff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tariff.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tariff.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTariffs(filtered);
    
    // Reset pagination when search changes
    setCurrentPage(1);
    const initialDisplayed = filtered.slice(0, ITEMS_PER_PAGE);
    setDisplayedTariffs(initialDisplayed);
    setHasMore(filtered.length > ITEMS_PER_PAGE);
  }, [searchTerm, availableTariffs]);

  // Add pagination effect
  useEffect(() => {
    if (currentPage > 1) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newItems = filteredTariffs.slice(startIndex, endIndex);
      
      setDisplayedTariffs(prev => [...prev, ...newItems]);
      setHasMore(endIndex < filteredTariffs.length);
    }
  }, [currentPage, filteredTariffs]);

  const loadAvailableTariffs = async () => {
    setLoading(true);
    try {
      // Get all tariffs
      const allTariffsResponse = await tariffService.getAllTariffs();
      
      // Get tariffs already assigned to this class
      const classTariffsResponse = await tariffService.getClassTariffs(classId);
      
      if (allTariffsResponse && classTariffsResponse) {
        // Handle different response structures
        const allTariffs = Array.isArray(allTariffsResponse) ? allTariffsResponse : allTariffsResponse.data;
        const classTariffs = classTariffsResponse.tariffs || classTariffsResponse.data?.tariffs || [];
        const assignedTariffIds = classTariffs.map(t => t.id);
        
        setAssignedTariffIds(assignedTariffIds);
        
        // Show all active tariffs (don't filter out assigned ones)
        const availableTariffs = Array.isArray(allTariffs) ? allTariffs.filter(tariff => tariff.is_active) : [];
        
        setAvailableTariffs(availableTariffs);
        
        // Pre-select already assigned tariffs
        setSelectedTariffs(assignedTariffIds);
      } else {
        // Set empty arrays as fallback
        setAvailableTariffs([]);
        setAssignedTariffIds([]);
        setSelectedTariffs([]);
      }
    } catch (error) {
      console.error('Error loading available tariffs:', error);
      toast.error('Failed to load available tariffs');
    } finally {
      setLoading(false);
    }
  };

  const handleTariffToggle = (tariffId) => {
    setSelectedTariffs(prev => 
      prev.includes(tariffId) 
        ? prev.filter(id => id !== tariffId)
        : [...prev, tariffId]
    );
  };

  const handleAssign = async () => {
    // Check if there are any changes
    const currentAssignments = [...assignedTariffIds].sort();
    const newAssignments = [...selectedTariffs].sort();
    
    if (JSON.stringify(currentAssignments) === JSON.stringify(newAssignments)) {
      toast.error('No changes to apply');
      return;
    }

    setAssigning(true);
    try {
      // Send all selected tariffs to backend (backend will sync/replace all assignments)
      await tariffService.assignTariffsToClass(classId, selectedTariffs);
      
      const assignedCount = selectedTariffs.filter(id => !assignedTariffIds.includes(id)).length;
      const unassignedCount = assignedTariffIds.filter(id => !selectedTariffs.includes(id)).length;
      
      let message = '';
      if (assignedCount > 0 && unassignedCount > 0) {
        message = `Successfully assigned ${assignedCount} and removed ${unassignedCount} tariff(s)`;
      } else if (assignedCount > 0) {
        message = `Successfully assigned ${assignedCount} tariff(s) to ${className}`;
      } else if (unassignedCount > 0) {
        message = `Successfully removed ${unassignedCount} tariff(s) from ${className}`;
      } else {
        message = `Tariff assignments updated successfully`;
      }
      
      toast.success(message);
      onAssignComplete?.();
      onClose();
    } catch (error) {
      console.error('Error updating tariff assignments:', error);
      toast.error('Failed to update tariff assignments');
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedTariffs([]);
    setSearchTerm('');
    setCurrentPage(1);
    setDisplayedTariffs([]);
    setHasMore(true);
    onClose();
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getTariffIcon = (type) => {
    switch (type) {
      case 'tuition': return <GraduationCap className="w-4 h-4" />;
      case 'transport': return <Car className="w-4 h-4" />;
      case 'meal': return <Utensils className="w-4 h-4" />;
      case 'activity_fee': return <BookOpen className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getTariffTypeColor = (type) => {
    switch (type) {
      case 'tuition': return 'bg-blue-100 text-blue-800';
      case 'transport': return 'bg-yellow-100 text-yellow-800';
      case 'meal': return 'bg-green-100 text-green-800';
      case 'activity_fee': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Target className="w-5 h-5 text-blue-600" />
            Manage Tariffs for {className}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tariffs by name, type, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Separator />

          {/* Selected Count */}
          {selectedTariffs.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Check className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {selectedTariffs.length} tariff(s) selected
              </span>
            </div>
          )}

          {/* Results Summary */}
          {!loading && filteredTariffs.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {displayedTariffs.length} of {filteredTariffs.length} tariffs
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
              {filteredTariffs.length !== availableTariffs.length && (
                <span className="text-xs">
                  ({availableTariffs.length} total available)
                </span>
              )}
            </div>
          )}

          {/* Tariffs Grid */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading available tariffs...</p>
              </div>
            ) : filteredTariffs.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No tariffs found matching your search' : 'No available tariffs to assign'}
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                    className="mt-2"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Tariff Cards Grid - 4 cards per row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedTariffs.map((tariff) => (
                    <Card key={tariff.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTariffToggle(tariff.id)}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header with checkbox and icon */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedTariffs.includes(tariff.id)}
                                onCheckedChange={(checked) => {
                                  handleTariffToggle(tariff.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="text-gray-600">
                                {getTariffIcon(tariff.type)}
                              </div>
                            </div>
                            {assignedTariffIds.includes(tariff.id) && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Assigned
                              </Badge>
                            )}
                          </div>
                          
                          {/* Tariff Name */}
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm truncate" title={tariff.name}>
                              {tariff.name}
                            </h4>
                            <Badge className={`${getTariffTypeColor(tariff.type)} text-xs mt-1`}>
                              {tariffService.formatTariffType(tariff.type)}
                            </Badge>
                          </div>
                          
                          {/* Description (optional, truncated) */}
                          {tariff.description && (
                            <p className="text-xs text-gray-600 overflow-hidden" title={tariff.description}>
                              {tariff.description.length > 60 ? `${tariff.description.substring(0, 60)}...` : tariff.description}
                            </p>
                          )}
                          
                          {/* Amount and Frequency */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                              <DollarSign className="w-3 h-3" />
                              {tariffService.formatAmount(tariff.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {tariffService.formatBillingFrequency(tariff.billing_frequency)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={loadMore}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Load More ({filteredTariffs.length - displayedTariffs.length} remaining)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={assigning}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assigning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {assigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Update Assignments ({selectedTariffs.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTariffModal; 