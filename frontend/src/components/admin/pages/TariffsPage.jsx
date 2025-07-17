import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter,
  BookOpen,
  Users,
  DollarSign,
  Target,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/ui/page-header';
import ClassCard from '@/components/admin/ClassCard';
import TariffModal from '@/components/admin/modals/TariffModal';
import TariffDetailsModal from '@/components/admin/modals/TariffDetailsModal';
import AssignTariffModal from '@/components/admin/modals/AssignTariffModal';
import tariffService from '@/services/tariffService';
import classService from '@/services/classService';
import toast from '@/utils/toast';

const TariffsPage = () => {
  const [gradeGroups, setGradeGroups] = useState([]);
  const [allTariffs, setAllTariffs] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalTariffs: 0,
    totalRevenue: 0,
    averagePerClass: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedGrades, setExpandedGrades] = useState({});
  
  // Modal states
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [targetClassId, setTargetClassId] = useState(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadInitialData();
  }, [searchTerm, statusFilter]);

  const loadInitialData = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      await Promise.all([
        loadClassesData(1, true),
        loadTariffs(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load tariff data');
    } finally {
      setLoading(false);
    }
  };

  const loadClassesData = async (page = 1, reset = false) => {
    try {
      // Since getClassesWithTariffCounts returns all classes, we don't need pagination parameters
      const response = await classService.getClassesWithTariffCounts();
      const classes = response.data || [];
      
      if (reset || page === 1) {
        // For initial load or reset, replace all data
        setGradeGroups(groupClassesByGrade(classes));
        setHasMore(false); // No more pages since we load all classes at once
      } else {
        // This branch shouldn't be reached since we load all classes at once
        setGradeGroups(prev => mergeGradeGroups(prev, groupClassesByGrade(classes)));
        setHasMore(false);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading classes:', error);
      throw error;
    }
  };

  const loadTariffs = async () => {
    try {
      const response = await tariffService.getAllTariffs();
      setAllTariffs(response.data || []);
    } catch (error) {
      console.error('Error loading tariffs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [tariffStatsResponse, classesResponse] = await Promise.all([
        tariffService.getTariffStats(),
        classService.getClassesWithTariffCounts()
      ]);
      
      const tariffStats = tariffStatsResponse || {};
      const classes = classesResponse?.data || [];
      
      // Calculate class-based statistics
      const totalClasses = classes.length;
      const totalTariffs = tariffStats.total_tariffs || 0;
      const totalRevenue = tariffStats.total_amount || 0;
      const averagePerClass = totalClasses > 0 ? totalRevenue / totalClasses : 0;
      
      setStats({
        totalClasses,
        totalTariffs,
        totalRevenue,
        averagePerClass
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        totalClasses: 0,
        totalTariffs: 0,
        totalRevenue: 0,
        averagePerClass: 0
      });
    }
  };

  const groupClassesByGrade = (classes) => {
    const grouped = classes.reduce((acc, classItem) => {
      const gradeName = classItem.grade?.name || 'Unknown Grade';
      if (!acc[gradeName]) {
        acc[gradeName] = {
          grade: classItem.grade,
          classes: []
        };
      }
      acc[gradeName].classes.push(classItem);
      return acc;
    }, {});

    return Object.entries(grouped).map(([gradeName, data]) => ({
      gradeName,
      grade: data.grade,
      classes: data.classes
    }));
  };

  const mergeGradeGroups = (existing, newGroups) => {
    const merged = [...existing];
    
    newGroups.forEach(newGroup => {
      const existingIndex = merged.findIndex(g => g.gradeName === newGroup.gradeName);
      if (existingIndex >= 0) {
        // Merge classes but avoid duplicates
        const existingClasses = merged[existingIndex].classes;
        const newClasses = newGroup.classes.filter(newClass => 
          !existingClasses.some(existingClass => existingClass.id === newClass.id)
        );
        merged[existingIndex].classes = [...existingClasses, ...newClasses];
      } else {
        merged.push(newGroup);
      }
    });
    
    return merged;
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await loadClassesData(currentPage + 1, false);
    } catch (error) {
      console.error('Error loading more classes:', error);
      toast.error('Failed to load more classes');
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, loadingMore, hasMore, searchTerm, statusFilter]);

  // Infinite scroll handler - disabled since we load all classes at once
  useEffect(() => {
    // Commented out infinite scroll since we load all classes at once
    // const handleScroll = () => {
    //   if (
    //     window.innerHeight + document.documentElement.scrollTop >=
    //     document.documentElement.offsetHeight - 1000
    //   ) {
    //     loadMore();
    //   }
    // };

    // window.addEventListener('scroll', handleScroll);
    // return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleGradeExpansion = (gradeName) => {
    setExpandedGrades(prev => ({
      ...prev,
      [gradeName]: !prev[gradeName]
    }));
  };

  const handleViewDetails = (classData) => {
    setSelectedClass(classData);
    setShowDetailsModal(true);
  };

  const handleCreateTariff = (classId = null) => {
    setSelectedTariff(null);
    setTargetClassId(classId);
    setShowTariffModal(true);
  };

  const handleEditTariff = (tariff) => {
    setSelectedTariff(tariff);
    setTargetClassId(null);
    setShowTariffModal(true);
  };

  const handleAssignTariffs = (classId) => {
    const classData = gradeGroups
      .flatMap(grade => grade.classes)
      .find(cls => cls.id === classId);
    
    if (classData) {
      setSelectedClass(classData);
      setShowAssignModal(true);
    }
  };

  const handleTariffSubmit = async (tariffData) => {
    try {
      if (selectedTariff) {
        await tariffService.updateTariff(selectedTariff.id, tariffData);
        toast.success('Tariff updated successfully');
      } else {
        await tariffService.createTariff(tariffData);
        toast.success('Tariff created successfully');
      }
      
      setShowTariffModal(false);
      setSelectedTariff(null);
      setTargetClassId(null);
      loadInitialData();
    } catch (error) {
      console.error('Error saving tariff:', error);
      toast.error('Failed to save tariff');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredGradeGroups = gradeGroups.filter(group => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      group.gradeName.toLowerCase().includes(searchLower) ||
      group.classes.some(classItem => 
        classItem.name.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tariff Management"
        description="Manage school fees and tariffs organized by class"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tariffs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTariffs}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalRevenue)}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average per Class</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.averagePerClass)}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search classes or grades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="with_tariffs">With Tariffs</SelectItem>
              <SelectItem value="without_tariffs">Without Tariffs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => handleCreateTariff()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Tariff
        </Button>
      </div>

      {/* Grade Groups */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredGradeGroups.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredGradeGroups.map((group) => (
            <Card key={group.gradeName} className="bg-white">
              <Collapsible 
                open={expandedGrades[group.gradeName] !== false}
                onOpenChange={() => toggleGradeExpansion(group.gradeName)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">{group.gradeName}</CardTitle>
                          <p className="text-sm text-gray-600">
                            {group.classes.length} class{group.classes.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {group.classes.reduce((sum, cls) => sum + (cls.tariffs_count || 0), 0)} tariffs
                        </Badge>
                        {expandedGrades[group.gradeName] !== false ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.classes.map((classData) => (
                        <ClassCard
                          key={classData.id}
                          classData={classData}
                          onViewDetails={handleViewDetails}
                          showGradeName={false}
                        />
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Load More Indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading more classes...</span>
        </div>
      )}

      {/* Modals */}
      <TariffModal
        isOpen={showTariffModal}
        onClose={() => {
          setShowTariffModal(false);
          setSelectedTariff(null);
          setTargetClassId(null);
        }}
        tariff={selectedTariff}
        onSubmit={handleTariffSubmit}
        targetClassId={targetClassId}
      />

      <TariffDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedClass(null);
        }}
        classId={selectedClass?.id}
        className={selectedClass?.name}
        onEditTariff={handleEditTariff}
        onCreateTariff={handleCreateTariff}
        onAssignTariffs={handleAssignTariffs}
        refreshData={loadInitialData}
      />

      <AssignTariffModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedClass(null);
        }}
        classId={selectedClass?.id}
        className={selectedClass?.full_name || selectedClass?.name}
        onAssignComplete={loadInitialData}
      />
    </div>
  );
};

export default TariffsPage; 